/**
 * Monitors network errors via monkey-patching:
 * - Failed XHR/fetch requests
 * - Network timeouts
 * - Aborted requests
 */
export type NetworkErrorHandler = (details: {
    type: 'fetch' | 'xhr';
    url: string;
    method: string;
    status: number;
    statusText: string;
    duration: number;
    error?: Error;
    requestBody?: any;
    responseBody?: any;
}) => void;
export declare class NetworkMonitor {
    private onError;
    private isMonitoring;
    private originalFetch;
    private originalXMLHttpRequest;
    private originalXHRPrototype;
    private trackSuccessfulRequests;
    private trackTimeout;
    private ignoredUrls;
    constructor(onError: NetworkErrorHandler);
    start(): void;
    stop(): void;
    /**
     * Configure monitoring options
     */
    configure(options: {
        trackSuccessfulRequests?: boolean;
        trackTimeout?: number;
        ignoredUrls?: RegExp[];
    }): void;
    private shouldIgnoreUrl;
    private patchFetch;
    private patchXMLHttpRequest;
    isActive(): boolean;
    getConfig(): {
        trackSuccessfulRequests: boolean;
        trackTimeout: number;
        ignoredUrls: RegExp[];
    };
}
//# sourceMappingURL=NetworkMonitor.d.ts.map