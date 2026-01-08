export interface EventBatchPayload {
    projectId: string;
    sessionId: string;
    events: EventPayload[];
    sessionContext: SessionContext;
}
export interface EventPayload {
    type: 'ERROR' | 'ACTION' | 'NETWORK' | 'PERFORMANCE' | 'CUSTOM';
    name: string;
    message?: string;
    stackTrace?: string;
    timestamp: string;
    url: string;
    metadata: {
        lineNumber?: number;
        columnNumber?: number;
        fileName?: string;
        tagName?: string;
        xPath?: string;
        networkUrl?: string;
        statusCode?: number;
        duration?: number;
        customField?: string;
        [key: string]: any;
    };
}
export interface SessionContext {
    browser: string;
    browserVersion: string;
    os: string;
    plugins: string[];
    screenResolution: string;
    viewportSize: string;
    cookiesHash?: string;
    timezone: string;
    language: string;
    userAgent?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    connectionType?: string;
}
export interface BugReportPayload {
    projectId: string;
    sessionId: string;
    screenshot: string;
    comment: string;
    userEmail?: string;
    currentUrl: string;
    reportedAt: string;
    additionalInfo: {
        deviceType: 'desktop' | 'mobile' | 'tablet';
        connectionType?: string;
        memoryUsage?: string;
        [key: string]: any;
    };
}
export interface ApiResponse {
    success: boolean;
    message: string;
    data: {
        sessionId: number;
        receivedCount: number;
        timestamp: string;
    };
}
//# sourceMappingURL=api.d.ts.map