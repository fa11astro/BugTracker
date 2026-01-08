// TypeScript
import { ScreenshotCapturer } from './ScreenshotCapturer';
import { BeaconClient } from '../api/BeaconClient';
import {Client} from "../api/Client";

export class BugReportModal {
    private modal: HTMLElement | null = null;
    private content: HTMLElement | null = null;
    private screenshotCapturer: ScreenshotCapturer;
    private screenshotData: string | null = null;
    private screenshotAllowed: boolean = false;
    private rememberConsentKey: string = 'bt_screenshot_allowed';
    private beaconClient: BeaconClient;
    private projectId: string;
    private sessionId: number;
    private onClose: () => void;
    private client: Client;

    constructor(
        beaconClient: BeaconClient,
        client: Client,
        projectId: string,
        sessionId: number,
        onClose: () => void
    ) {
        this.beaconClient = beaconClient;
        this.client = client;
        this.projectId = projectId;
        this.sessionId = sessionId;
        this.onClose = onClose;
        this.screenshotCapturer = new ScreenshotCapturer();
    }

    public async open(): Promise<void> {
        if (this.modal) return;

        this.modal = this.createModal();
        document.body.appendChild(this.modal);

        // Restore remembered consent if available
        try {
            const stored = sessionStorage.getItem(this.rememberConsentKey);
            if (stored === '1') this.screenshotAllowed = true;
        } catch (e) {
            // storage might be blocked by tracking prevention; silently ignore
        }

        // Capture initial screenshot (optional target)
        if (this.screenshotAllowed) {
            try {
                // Capture the body before modal is rendered
                await this.capturePreview(document.body);
            } catch (error) {
                console.warn('Failed to capture initial screenshot:', error);
            }
        }
    }

    public close(): void {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
            this.modal = null;
            this.content = null;
        }
        this.onClose();
    }

    private createModal(): HTMLElement {
        const modal = document.createElement('div');
        modal.className = 'bugtracker-modal-overlay';
        modal.innerHTML = this.getModalHTML();
        this.applyStyles(modal);
        this.attachEventListeners(modal);
        return modal;
    }

    // Accept optional target; if not provided, use preview area or document.body
    public async capturePreview(targetElement?: HTMLElement): Promise<string> {
        const target = targetElement
            || (this.content?.querySelector('#bugtracker-screenshot-preview') as HTMLElement)
            || (document.body as HTMLElement);

        try {
            const dataUrl = await this.screenshotCapturer.capturePreview(target);
            // Update preview element
            this.updatePreviewElement(
                this.content?.querySelector('#bugtracker-screenshot-preview') as HTMLElement,
                dataUrl
            );
            this.screenshotData = dataUrl;
            return dataUrl;
        } catch (error) {
            this.showPreviewError(
                this.content?.querySelector('#bugtracker-screenshot-preview') as HTMLElement,
                error
            );
            throw error;
        }
    }

    private async submitReport(): Promise<void> {
        const submitBtn = this.content?.querySelector('.bugtracker-modal-submit') as HTMLButtonElement;
        const commentInput = this.content?.querySelector('#bugtracker-comment') as HTMLTextAreaElement;
        const emailInput = this.content?.querySelector('#bugtracker-email') as HTMLInputElement;

        if (!submitBtn || !commentInput) return;

        // Validate comment
        const comment = commentInput.value.trim();
        if (!comment) {
            this.showError('Please describe what went wrong');
            return;
        }

        if (comment.length > 1000) {
            this.showError('Description must be less than 1000 characters');
            return;
        }

        // Disable submit button
        submitBtn.disabled = true;
        const originalInner = submitBtn.innerHTML;
        submitBtn.innerHTML = `
        <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px; margin-right: 6px;"></div>
        Submitting...
    `;

        try {
            // Capture final screenshot (higher quality) if we already have one or attempt to capture
            let finalScreenshot: string | null = this.screenshotData;
            if (!finalScreenshot && this.screenshotAllowed) {
                try {
                    finalScreenshot = await this.screenshotCapturer.captureFinal();
                } catch (error) {
                    console.warn('Failed to capture final screenshot:', error);
                    // fallback to preview or null
                }
            }

            // Convert screenshot to blob if available
            let screenshotBlob: Blob | null = null;
            if (finalScreenshot) {
                screenshotBlob = await this.screenshotCapturer.dataUrlToBlob(finalScreenshot);
            }

            // Build report data matching ReportCreationRequestWidget DTO
            const reportData = {
                projectId: this.projectId,
                sessionId: this.sessionId,
                title: comment.substring(0, 100),
                tags: [],
                reportedAt: new Date().toISOString(),
                comments: comment,
                userEmail: emailInput?.value.trim() || null,
                currentUrl: window.location.href,
                userProvided: true
            };

            // Send report with multipart form data
            const success = await this.beaconClient.sendBugReportMultipart(reportData, screenshotBlob);

            if (!success) {
                throw new Error('Failed to submit report');
            }

            this.showSuccess('Report submitted successfully!');

            const newSessionId = await this.client.restartSession();
            if (newSessionId) {
                this.sessionId = newSessionId;
            }

            setTimeout(() => {
                this.close();
            }, 1500);
        } catch (error) {
            console.error('Failed to submit bug report:', error);
            this.showError('Failed to submit report. Please try again.');
        } finally {
            // Re-enable submit button and restore content
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalInner;
        }
    }

    /**
     * Capture screenshot for preview - existing helper kept
     */
    private async captureScreenshot(): Promise<void> {
        const previewElement = this.content?.querySelector('#bugtracker-screenshot-preview') as HTMLElement;
        if (!previewElement) return;

        try {
            // Hide modal temporarily
            if (this.modal) {
                this.modal.style.display = 'none';
            }

            // Small delay to ensure modal is hidden from rendering
            await new Promise(resolve => setTimeout(resolve, 100));

            // Capture the page without the modal
            this.screenshotData = await this.screenshotCapturer.capturePreview(document.body);

            // Show modal again
            if (this.modal) {
                this.modal.style.display = 'flex';
            }
            this.updatePreviewElement(previewElement, this.screenshotData);
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            this.showScreenshotError(previewElement as HTMLElement, error);
        }
    }

    /* ---------- Helper / UI methods implemented to satisfy TS and behavior ---------- */

    private getModalHTML(): string {
        return `
        <div class="bugtracker-modal">
            <div class="bugtracker-modal-content">
                <button class="bugtracker-modal-close" aria-label="Close">&times;</button>
                <h2>Report a bug</h2>
                <div id="bugtracker-screenshot-area">
                    <div id="bugtracker-screenshot-preview" class="bugtracker-screenshot-placeholder">No screenshot</div>
                    <div style="margin-top:8px;">
                        <button id="bugtracker-capture-btn" type="button">Capture Screenshot</button>
                    </div>
                    <div id="bugtracker-screenshot-consent" style="display:none;margin-top:8px;padding:8px;border-radius:4px;background:#f9f9f9;">
                        <div style="margin-bottom:6px;">Do you allow taking a screenshot of your browser window for this bug report? This will capture visible content only.</div>
                        <label style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><input type="checkbox" id="bugtracker-remember-consent" /> Remember my choice for this session</label>
                        <div>
                            <button id="bugtracker-allow-screenshot" type="button" style="margin-right:8px;">Allow</button>
                            <button id="bugtracker-deny-screenshot" type="button">Deny</button>
                        </div>
                        <div id="bugtracker-screenshot-consent-error" style="display:none;color:#c62828;margin-top:6px;font-size:12px;"></div>
                    </div>
                </div>
                <textarea id="bugtracker-comment" placeholder="Describe what happened" rows="6"></textarea>
                <input id="bugtracker-email" placeholder="Your email (optional)" type="email" />
                <div class="bugtracker-error" style="display:none;color:#c62828;margin-top:8px;"></div>
                <div style="margin-top:12px;">
                    <button class="bugtracker-modal-submit">Submit Report</button>
                </div>
            </div>
        </div>
        `;
    }

    private applyStyles(modal: HTMLElement): void {
        // Minimal inline styles to make it usable. For production, move to CSS.
        const style = document.createElement('style');
        style.textContent = `
        .bugtracker-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
        }
        .bugtracker-modal { max-width: 720px; width: 92%; }
        .bugtracker-modal-content {
            background: #fff;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
        .bugtracker-modal-close {
            float: right;
            background: transparent;
            border: none;
            font-size: 20px;
            cursor: pointer;
        }
        #bugtracker-screenshot-preview {
            width: 100%;
            height: 160px;
            background: #f4f4f4;
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:hidden;
            border-radius:4px;
        }
        #bugtracker-screenshot-preview img { max-width:100%; max-height:100%; display:block; }
        #bugtracker-comment { width:100%; margin-top:8px; box-sizing:border-box; }
        #bugtracker-email { width:100%; margin-top:8px; box-sizing:border-box; padding:6px; }
        .bugtracker-modal-submit { margin-top:8px; padding:8px 12px; cursor:pointer; }
        `;
        modal.appendChild(style);
    }

    private attachEventListeners(modal: HTMLElement): void {
        // Keep a reference to content area
        this.content = modal.querySelector('.bugtracker-modal-content') as HTMLElement;

        const closeBtn = this.content?.querySelector('.bugtracker-modal-close') as HTMLButtonElement;
        closeBtn?.addEventListener('click', () => this.close());

        const submitBtn = this.content?.querySelector('.bugtracker-modal-submit') as HTMLButtonElement;
        submitBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitReport();
        });

        const captureBtn = this.content?.querySelector('#bugtracker-capture-btn') as HTMLButtonElement;
        captureBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.requestConsentAndCapture();
        });

        const allowBtn = this.content?.querySelector('#bugtracker-allow-screenshot') as HTMLButtonElement;
        allowBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleAllowConsent();
        });

        const denyBtn = this.content?.querySelector('#bugtracker-deny-screenshot') as HTMLButtonElement;
        denyBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleDenyConsent();
        });

        // Allow clicking preview to re-capture or zoom later
        /*const preview = this.content?.querySelector('#bugtracker-screenshot-preview') as HTMLElement;
        preview?.addEventListener('click', async () => {
            await this.requestConsentAndCapture();
        });
        */

        // Close when clicking outside content
        modal.addEventListener('click', (evt) => {
            if (evt.target === modal) this.close();
        });
    }

    private async requestConsentAndCapture(): Promise<void> {
        if (this.screenshotAllowed) {
            await this.captureScreenshot();
            return;
        }

        // Show consent UI inside modal
        const consentEl = this.content?.querySelector('#bugtracker-screenshot-consent') as HTMLElement | null;
        if (!consentEl) return;
        consentEl.style.display = 'block';
        // scroll into view
        consentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    private async handleAllowConsent(): Promise<void> {
        // Mark consent and optionally remember
        this.screenshotAllowed = true;
        const rememberCheckbox = this.content?.querySelector('#bugtracker-remember-consent') as HTMLInputElement | null;
        const remember = !!(rememberCheckbox && rememberCheckbox.checked);
        if (remember) {
            try {
                sessionStorage.setItem(this.rememberConsentKey, '1');
            } catch (e) {
                // storage might be blocked
                console.debug('[BugTracker] Could not persist screenshot consent:', e);
            }
        }

        // Hide consent UI and proceed to capture
        const consentEl = this.content?.querySelector('#bugtracker-screenshot-consent') as HTMLElement | null;
        if (consentEl) consentEl.style.display = 'none';

        try {
            await this.captureScreenshot();
        } catch (err) {
            const errEl = this.content?.querySelector('#bugtracker-screenshot-consent-error') as HTMLElement | null;
            if (errEl) {
                errEl.style.display = 'block';
                errEl.textContent = 'Screenshot capture failed. You can still submit without a screenshot.';
            }
        }
    }

    private handleDenyConsent(): void {
        this.screenshotAllowed = false;
        // hide consent UI
        const consentEl = this.content?.querySelector('#bugtracker-screenshot-consent') as HTMLElement | null;
        if (consentEl) consentEl.style.display = 'none';
        // show short message
        this.showError('Screenshot denied. You can still submit the report without a screenshot.');
    }

    private updatePreviewElement(target: HTMLElement | undefined | null, dataUrl: string): void {
        if (!target) return;
        target.innerHTML = '';
        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = 'Screenshot preview';
        target.appendChild(img);
    }

    private showPreviewError(target: HTMLElement | undefined | null, error: unknown): void {
        console.error('Preview capture error:', error);
        if (target) {
            target.textContent = 'Failed to capture preview';
        }
        this.showError('Failed to capture preview screenshot');
    }

    private showScreenshotError(target: HTMLElement, error: unknown): void {
        console.error('Screenshot error:', error);
        target.textContent = 'Failed to capture screenshot';
        this.showError('Failed to capture screenshot');
    }

    private showError(message: string): void {
        const errEl = this.content?.querySelector('.bugtracker-error') as HTMLElement | null;
        if (!errEl) return;
        errEl.textContent = message;
        errEl.style.display = 'block';
        // auto-hide after some time
        setTimeout(() => {
            errEl.style.display = 'none';
        }, 5000);
    }

    private showSuccess(message: string): void {
        const errEl = this.content?.querySelector('.bugtracker-error') as HTMLElement | null;
        if (!errEl) return;
        errEl.textContent = message;
        errEl.style.display = 'block';
        errEl.style.color = '#2e7d32'; // green color for success
        // auto-hide after some time
        setTimeout(() => {
            errEl.style.display = 'none';
            errEl.style.color = '#c62828'; // reset to error color
        }, 5000);
    }

}