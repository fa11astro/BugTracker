import { InternalEvent } from '../types/events';
import { SessionData } from '../types/session';
import { EventBatchPayload, EventPayload, BugReportPayload } from '../types/api';
export declare class PayloadBuilder {
    static buildEventBatchPayload(projectId: string, sessionId: string, events: InternalEvent[], sessionData: SessionData): EventBatchPayload;
    static buildEventPayload(event: InternalEvent): EventPayload;
    static buildSessionContext(sessionData: SessionData): {
        browser: string;
        browserVersion: string;
        os: string;
        plugins: string[];
        screenResolution: string;
        viewportSize: string;
        cookiesHash: string | undefined;
        timezone: string;
        language: string;
        userAgent: string;
        deviceType: "desktop" | "mobile" | "tablet";
        connectionType: string | undefined;
    };
    static buildBugReportPayload(projectId: string, sessionId: string, data: {
        screenshot: string;
        comment: string;
        email?: string;
        currentUrl: string;
    }, sessionData: SessionData): BugReportPayload;
    static buildEventRequest(projectId: String, sessionId: number, event: InternalEvent, sessionData: SessionData): {
        sessionId: number;
        type: import("../types/events").EventType;
        name: string;
        log: string;
        stackTrace: string;
        url: string;
        element: any;
        timestamp: string;
        metadata: {
            fileName: string;
            lineNumber: string;
            statusCode: string;
        };
    };
    static buildReportWidgetRequest(projectId: String, sessionId: number, data: {
        screenshot: string;
        comment: string;
        email?: string;
        currentUrl: string;
    }, sessionData: SessionData): {
        projectId: String;
        sessionId: number;
        title: string;
        tags: never[];
        reportedAt: string;
        comments: string;
        userEmail: string | undefined;
        screen: string;
        currentUrl: string;
        userProvided: boolean;
    };
    static buildSessionRequest(projectId: String, sessionData: SessionData): {
        projectId: String;
        startTime: string;
        browser: string;
        browserVersion: string;
        os: string;
        deviceType: "desktop" | "mobile" | "tablet";
        screenResolution: string;
        viewportSize: string;
        language: string;
        userAgent: string;
        ipAddress: undefined;
        cookiesHash: string | undefined;
        plugins: string[];
    };
}
//# sourceMappingURL=payloads.d.ts.map