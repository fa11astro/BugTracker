export declare enum EventType {
    ERROR = "ERROR",
    ACTION = "ACTION",
    NETWORK = "NETWORK",
    PERFORMANCE = "PERFORMANCE",
    CUSTOM = "CUSTOM"
}
export interface InternalEvent {
    type: EventType;
    name: string;
    timestamp: string;
    url: string;
    message?: string;
    stackTrace?: string;
    lineNumber?: number;
    columnNumber?: number;
    fileName?: string;
    tagName?: string;
    xPath?: string;
    networkUrl?: string;
    statusCode?: number;
    duration?: number;
    customMetadata?: Record<string, any>;
}
//# sourceMappingURL=events.d.ts.map