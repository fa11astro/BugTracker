import { EventBatchPayload, BugReportPayload } from '../types/api';
export declare class BeaconClient {
    private baseUrl;
    private maxPayloadSize;
    constructor(baseUrl: string);
    sendEvents(payload: EventBatchPayload): boolean;
    sendBugReport(payload: BugReportPayload): Promise<boolean>;
    /**
     * Send bug report with multipart/form-data (JSON + screenshot file)
     * Matches backend ReportCreationRequestWidget DTO
     */
    sendBugReportMultipart(reportData: {
        projectId: string;
        sessionId: number;
        title: string;
        tags: string[];
        reportedAt: string;
        comments: string;
        userEmail: string | null;
        currentUrl: string;
        userProvided: boolean;
    }, screenshotBlob: Blob | null): Promise<boolean>;
    sendHeartbeat(sessionId: string, projectId: string): boolean;
    /**
     * Process bug report payload to reduce size if needed
     */
    private processBugReportPayload;
    private sendTruncatedEvents;
    private compressImage;
    private getPayloadSize;
    static isAvailable(): boolean;
    getMaxPayloadSize(): number;
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=BeaconClient.d.ts.map