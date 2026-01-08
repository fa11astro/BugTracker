/**
 * Tracks performance metrics:
 * - Page load times
 * - Core Web Vitals
 * - Resource timing
 * - Long tasks
 */
export type PerformanceHandler = (metric: {
    name: string;
    value: number;
    unit: 'ms' | 's' | 'score';
    metadata: {
        url: string;
        timestamp: string;
        [key: string]: any;
    };
}) => void;
export declare class PerformanceMonitor {
    private onMetric;
    private isMonitoring;
    private observedEntries;
    private trackCoreWebVitals;
    private trackResourceTiming;
    private trackLongTasks;
    private threshold;
    constructor(onMetric: PerformanceHandler);
    start(): void;
    stop(): void;
    configure(options: {
        trackCoreWebVitals?: boolean;
        trackResourceTiming?: boolean;
        trackLongTasks?: boolean;
        threshold?: number;
    }): void;
    private trackNavigationTiming;
    private captureNavigationTiming;
    private trackCoreWebVitalsMetrics;
    private trackResourceTimingMetrics;
    private trackLongTasksMetrics;
    private reportMetric;
    captureMetric(name: string, value: number, metadata?: Record<string, any>): void;
    getCurrentMetrics(): Record<string, number>;
    isActive(): boolean;
    getConfig(): {
        trackCoreWebVitals: boolean;
        trackResourceTiming: boolean;
        trackLongTasks: boolean;
        threshold: number;
    };
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map