export declare function measureExecution<T>(fn: () => T, name: string): {
    result: T;
    duration: number;
};
export declare function getPerformanceTiming(): Record<string, number>;
/**
 * Calculate performance metrics from timing data
 */
export declare function calculatePerformanceMetrics(): Record<string, number>;
export declare function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=timing.d.ts.map