import { ApiResponse } from '../types/api';
import { InternalEvent } from '../types/events';
import { SessionData } from '../types/session';
export declare class Client {
    private baseUrl;
    private projectId;
    constructor(baseUrl: string, projectId: string);
    sendEvents(events: InternalEvent[], sessionId: string | number, sessionData: SessionData): Promise<ApiResponse>;
    sendEventsWithBeacon(events: InternalEvent[], sessionId: string | number, sessionData: SessionData): boolean;
    sendBugReport(data: {
        screenshot: string;
        comment: string;
        email?: string;
    }, sessionId: string | number, sessionData: SessionData): Promise<ApiResponse>;
    sendSessionStart(sessionId: string, sessionData: SessionData): Promise<number | null>;
}
//# sourceMappingURL=Client.d.ts.map