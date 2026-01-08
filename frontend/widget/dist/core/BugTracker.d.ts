import { BugTrackerConfig } from '../types/config';
export declare class BugTracker {
    private config;
    private sessionManager;
    private eventBuffer;
    private errorCatcher;
    private networkMonitor;
    private userActionTracker;
    private widgetButton;
    private client;
    private beaconClient;
    private flushTimer;
    private isInitialized;
    constructor(config: BugTrackerConfig);
    /**
     * Initialize tracking
     */
    initialize(): Promise<void>;
    private trackJSError;
    private trackNetworkError;
    /**
     * Track User Action
     */
    private trackUserAction;
    /**
     * Public API: Track custom event
     */
    trackEvent(name: string, metadata?: Record<string, any>): void;
    /**
     * Public API: Capture error manually
     */
    captureError(error: Error, metadata?: Record<string, any>): void;
    /**
     * Add event to buffer
     */
    private addEvent;
    /**
     * Flush events to backend
     */
    private flushEvents;
    /**
     * Open bug report modal
     */
    private openBugReport;
    private startFlushTimer;
    /**
     * Setup page unload handler with Beacon API
     */
    private setupPageUnloadHandler;
    /**
     * Utility: Get element XPath
     */
    private getElementXPath;
    /**
     * Public API: Destroy and cleanup
     */
    destroy(): void;
    /**
     * Public API: Get current session ID
     */
    getSessionId(): number;
    /**
     * Public API: Manually flush events
     */
    flush(): Promise<void>;
    /**
     * Public helper: wait until server-created session id (numeric) is available.
     * Returns the numeric session id or null if timed out.
     */
    waitForServerSession(timeoutMs?: number): Promise<number | null>;
    /**
     * Public helper: attempt to create a server session immediately and return the numeric server id or null.
     * Useful for debugging network/CORS issues from the console: call window._bt.ensureServerSession().
     */
    ensureServerSession(): Promise<number | null>;
}
//# sourceMappingURL=BugTracker.d.ts.map