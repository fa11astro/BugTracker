import type { SessionData } from './types/session';
import type { InternalEvent } from './types/events';
type InitOptions = {
    baseUrl?: string;
    debug?: boolean;
};
declare const api: {
    initialize(projectId: string | number, opts?: InitOptions): Promise<any>;
    sendEvents(events: InternalEvent[], sessionId: string | number, sessionData: SessionData): Promise<import("./types/api").ApiResponse>;
    sendEventsWithBeacon(events: InternalEvent[], sessionId: string | number, sessionData: SessionData): boolean;
    sendBugReport(payload: {
        screenshot: string;
        comment: string;
        email?: string;
    }, sessionId: string | number, sessionData: SessionData): Promise<import("./types/api").ApiResponse>;
    isInitialized(): boolean;
};
export declare const initialize: (projectId: string | number, opts?: InitOptions) => Promise<any>;
export declare const sendEvents: (events: InternalEvent[], sessionId: string | number, sessionData: SessionData) => Promise<import("./types/api").ApiResponse>;
export declare const sendEventsWithBeacon: (events: InternalEvent[], sessionId: string | number, sessionData: SessionData) => boolean;
export declare const sendBugReport: (payload: {
    screenshot: string;
    comment: string;
    email?: string;
}, sessionId: string | number, sessionData: SessionData) => Promise<import("./types/api").ApiResponse>;
export declare const isInitialized: () => boolean;
export declare const BugTracker: {
    initialize(projectId: string | number, opts?: InitOptions): Promise<any>;
    sendEvents(events: InternalEvent[], sessionId: string | number, sessionData: SessionData): Promise<import("./types/api").ApiResponse>;
    sendEventsWithBeacon(events: InternalEvent[], sessionId: string | number, sessionData: SessionData): boolean;
    sendBugReport(payload: {
        screenshot: string;
        comment: string;
        email?: string;
    }, sessionId: string | number, sessionData: SessionData): Promise<import("./types/api").ApiResponse>;
    isInitialized(): boolean;
};
export default api;
//# sourceMappingURL=index.d.ts.map