export interface BugTrackerConfig {
    projectId: string;
    apiUrl: string;
    maxBufferSize?: number;
    flushInterval?: number;
    captureUserActions?: boolean;
    captureNetworkErrors?: boolean;
    capturePerformance?: boolean;
    captureConsoleErrors?: boolean;
    buttonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    buttonText?: string;
    disableScreenshots?: boolean;
    sessionTimeout?: number;
    sessionId?: string;
    ignoreUrls?: RegExp[];
    sampleRate?: number;
    ignoredActions?: string[];
    beforeSend?: (event: any) => any | null;
    onError?: (error: Error) => void;
    debug?: boolean;
    environment?: string;
    release?: string;
}
export declare const DEFAULT_CONFIG: Partial<BugTrackerConfig>;
//# sourceMappingURL=config.d.ts.map