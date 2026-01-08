export declare const ERROR_NAMES: {
    readonly TYPE_ERROR: "TypeError";
    readonly REFERENCE_ERROR: "ReferenceError";
    readonly SYNTAX_ERROR: "SyntaxError";
    readonly RANGE_ERROR: "RangeError";
    readonly URI_ERROR: "URIError";
    readonly EVAL_ERROR: "EvalError";
    readonly NETWORK_ERROR: "NetworkError";
    readonly ABORT_ERROR: "AbortError";
    readonly TIMEOUT_ERROR: "TimeoutError";
    readonly CONSOLE_ERROR: "ConsoleError";
    readonly UNHANDLED_REJECTION: "UnhandledRejection";
    readonly WINDOW_ERROR: "WindowError";
};
export declare const METADATA_KEYS: {
    readonly LINE_NUMBER: "lineNumber";
    readonly COLUMN_NUMBER: "columnNumber";
    readonly FILENAME: "fileName";
    readonly STACK_TRACE: "stackTrace";
    readonly REQUEST_URL: "requestUrl";
    readonly STATUS_CODE: "statusCode";
    readonly METHOD: "method";
    readonly RESPONSE_TIME: "responseTime";
    readonly ELEMENT_TYPE: "elementType";
    readonly ELEMENT_ID: "elementId";
    readonly ELEMENT_CLASS: "elementClass";
    readonly XPATH: "xPath";
    readonly TEXT_CONTENT: "textContent";
    readonly COORDINATES: "coordinates";
    readonly VALUE: "value";
    readonly LOAD_TIME: "loadTime";
    readonly DOM_READY_TIME: "domReadyTime";
    readonly FCP: "fcp";
    readonly LCP: "lcp";
    readonly FID: "fid";
    readonly CLS: "cls";
};
export declare const DEFAULT_EVENT_METADATA: {
    userAgent: string;
    url: string;
    timestamp: () => string;
};
//# sourceMappingURL=events.d.ts.map