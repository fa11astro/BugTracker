export declare class ConfigurationError extends Error {
    constructor(message: string);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare function validateConfig(config: any): void;
export declare function validateEvent(event: any): boolean;
export declare function sanitizeData(data: any): any;
//# sourceMappingURL=validation.d.ts.map