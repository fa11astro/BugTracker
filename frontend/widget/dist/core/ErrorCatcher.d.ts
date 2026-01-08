/**
 * Catches JavaScript errors as per your design:
 * - window.onerror
 * - unhandled promise rejections
 * - console.error (optional)
 */
export type ErrorHandler = (error: Error, metadata?: {
    type: 'window' | 'promise' | 'console';
    event?: ErrorEvent;
    reason?: any;
}) => void;
export declare class ErrorCatcher {
    private onError;
    private isCapturing;
    private originalConsoleError;
    private ignoredErrors;
    constructor(onError: ErrorHandler);
    start(): void;
    stop(): void;
    enableConsoleErrors(): void;
    disableConsoleErrors(): void;
    ignoreErrors(patterns: string[]): void;
    private shouldIgnoreError;
    private handleWindowError;
    private handleUnhandledRejection;
    captureError(error: Error, metadata?: Record<string, any>): void;
    isActive(): boolean;
    getIgnoredErrors(): string[];
    clearIgnoredErrors(): void;
}
//# sourceMappingURL=ErrorCatcher.d.ts.map