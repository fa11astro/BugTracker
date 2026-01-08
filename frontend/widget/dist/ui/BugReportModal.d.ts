import { BeaconClient } from '../api/BeaconClient';
export declare class BugReportModal {
    private modal;
    private content;
    private screenshotCapturer;
    private screenshotData;
    private screenshotAllowed;
    private rememberConsentKey;
    private beaconClient;
    private projectId;
    private sessionId;
    private onClose;
    constructor(beaconClient: BeaconClient, projectId: string, sessionId: number, onClose: () => void);
    open(): Promise<void>;
    close(): void;
    private createModal;
    capturePreview(targetElement?: HTMLElement): Promise<string>;
    private submitReport;
    /**
     * Capture screenshot for preview - existing helper kept
     */
    private captureScreenshot;
    private getModalHTML;
    private applyStyles;
    private attachEventListeners;
    private requestConsentAndCapture;
    private handleAllowConsent;
    private handleDenyConsent;
    private updatePreviewElement;
    private showPreviewError;
    private showScreenshotError;
    private showError;
}
//# sourceMappingURL=BugReportModal.d.ts.map