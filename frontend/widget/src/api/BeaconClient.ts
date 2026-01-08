import { EventBatchPayload, BugReportPayload } from '../types/api';

export class BeaconClient {
    private baseUrl: string;
    private maxPayloadSize: number = 64000; // Beacon API limit (~64KB)

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    public sendEvents(payload: EventBatchPayload): boolean {
        if (!navigator.sendBeacon) {
            console.warn('Beacon API is not supported in this browser');
            return false;
        }

        // Check payload size
        const serialized = JSON.stringify(payload);
        if (this.getPayloadSize(serialized) > this.maxPayloadSize) {
            console.warn('Payload too large for Beacon API, truncating events');
            return this.sendTruncatedEvents(payload);
        }

        const url = `${this.baseUrl}/api/events`;
        const blob = new Blob([serialized], { type: 'application/json' });

        return navigator.sendBeacon(url, blob);
    }

    public async sendBugReport(payload: BugReportPayload): Promise<boolean> {
        if (!navigator.sendBeacon) {
            console.warn('Beacon API is not supported in this browser');
            return false;
        }

        // Check if screenshot is too large
        const processedPayload = await this.processBugReportPayload(payload);

        const url = `${this.baseUrl}/api/reports/widget`;
        const blob = new Blob([JSON.stringify(processedPayload)], {
            type: 'application/json'
        });

        return navigator.sendBeacon(url, blob);
    }

    /**
     * Send bug report with multipart/form-data (JSON + screenshot file)
     * Matches backend ReportCreationRequestWidget DTO
     */
    public async sendBugReportMultipart(
        reportData: {
            projectId: string;
            sessionId: number;
            title: string;
            tags: string[];
            reportedAt: string;
            comments: string;
            userEmail: string | null;
            currentUrl: string;
            userProvided: boolean;
        },
        screenshotBlob: Blob | null
    ): Promise<boolean> {
        const url = `${this.baseUrl}/api/reports/widget`;

        try {
            const formData = new FormData();

            // Add JSON metadata as a blob with application/json content type
            formData.append('request', new Blob([JSON.stringify(reportData)], { type: 'application/json' }));

            // Add screenshot file if provided (optional)
            if (screenshotBlob) {
                formData.append('screen', screenshotBlob, 'screenshot.jpg');
            }

            // Use fetch instead of sendBeacon for multipart/form-data
            const response = await fetch(url, {
                method: 'POST',
                body: formData
                // Do NOT set Content-Type header - browser sets it with boundary automatically
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to send bug report:', error);
            return false;
        }
    }

    /**
     * Process bug report payload to reduce size if needed
     */
    private async processBugReportPayload(payload: BugReportPayload): Promise<BugReportPayload> {
        // If screenshot is too large, compress it or remove it
        if (payload.screenshot && payload.screenshot.length > 500000) { // ~500KB
            console.warn('Screenshot too large for Beacon API, compressing');

            // Try to compress by reducing quality
            const compressedScreenshot = await this.compressImage(payload.screenshot, 0.5);
            if (compressedScreenshot) {
                return {
                    ...payload,
                    screenshot: compressedScreenshot,
                    additionalInfo: {
                        ...payload.additionalInfo,
                        screenshotCompressed: true,
                        originalSize: payload.screenshot.length,
                        compressedSize: compressedScreenshot.length
                    }
                };
            }

            // If compression fails, remove screenshot
            return {
                ...payload,
                screenshot: '',
                additionalInfo: {
                    ...payload.additionalInfo,
                    screenshotRemoved: true,
                    reason: 'Too large for transmission'
                }
            };
        }

        return payload;
    }

    private sendTruncatedEvents(payload: EventBatchPayload): boolean {
        // Sort events by timestamp (newest first) and keep only recent ones
        const sortedEvents = [...payload.events]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10); // Keep only 10 most recent events

        const truncatedPayload = {
            ...payload,
            events: sortedEvents,
            truncated: true,
            originalEventCount: payload.events.length,
            truncatedEventCount: sortedEvents.length
        };

        const url = `${this.baseUrl}/api/events`;
        const blob = new Blob([JSON.stringify(truncatedPayload)], {
            type: 'application/json'
        });

        return navigator.sendBeacon(url, blob);
    }

    private async compressImage(dataUrl: string, quality: number = 0.5): Promise<string | null> {
        return new Promise((resolve) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(null);
                    return;
                }

                // Calculate new dimensions (reduce by 50%)
                const width = img.width * 0.5;
                const height = img.height * 0.5;

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL('image/jpeg', quality);

                resolve(compressed);
            };

            img.onerror = () => {
                resolve(null);
            };

            img.src = dataUrl;
        });
    }

    private getPayloadSize(payload: string): number {
        // Convert string to Blob to get accurate size
        const blob = new Blob([payload]);
        return blob.size;
    }

    public static isAvailable(): boolean {
        return typeof navigator !== 'undefined' &&
            'sendBeacon' in navigator &&
            typeof navigator.sendBeacon === 'function';
    }

    public getMaxPayloadSize(): number {
        // Different browsers have different limits
        const userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.includes('chrome')) {
            return 65536; // 64KB for Chrome
        } else if (userAgent.includes('firefox')) {
            return 65536; // 64KB for Firefox
        } else if (userAgent.includes('safari')) {
            return 65536; // 64KB for Safari
        } else if (userAgent.includes('edge')) {
            return 65536; // 64KB for Edge
        }

        return 64000; // Default 64KB
    }

    public testConnection(): Promise<boolean> {
        return new Promise((resolve) => {
            if (!navigator.sendBeacon) {
                resolve(false);
                return;
            }

            const testData = {
                test: true,
                timestamp: new Date().toISOString()
            };

            const url = `${this.baseUrl}/api/test`;
            const blob = new Blob([JSON.stringify(testData)], {
                type: 'application/json'
            });

            const success = navigator.sendBeacon(url, blob);
            resolve(success);
        });
    }
}