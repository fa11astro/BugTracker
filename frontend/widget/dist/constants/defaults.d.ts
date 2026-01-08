export declare const EVENT_TYPES: {
    readonly ERROR: "ERROR";
    readonly ACTION: "ACTION";
    readonly NETWORK: "NETWORK";
    readonly PERFORMANCE: "PERFORMANCE";
    readonly CUSTOM: "CUSTOM";
    readonly SESSION_START: "SESSION_START";
    readonly SESSION_END: "SESSION_END";
};
export declare const ERROR_LEVELS: {
    readonly FATAL: "fatal";
    readonly ERROR: "error";
    readonly WARNING: "warning";
    readonly INFO: "info";
    readonly DEBUG: "debug";
};
export declare const DEFAULT_MAX_BUFFER_SIZE = 50;
export declare const DEFAULT_FLUSH_INTERVAL = 5000;
export declare const DEFAULT_SESSION_TIMEOUT: number;
export declare const BUTTON_POSITIONS: readonly ["top-left", "top-right", "bottom-left", "bottom-right"];
export declare const PERFORMANCE_METRICS: {
    readonly LOAD_TIME: "load_time";
    readonly DOM_READY_TIME: "dom_ready_time";
    readonly FIRST_CONTENTFUL_PAINT: "first_contentful_paint";
    readonly LARGEST_CONTENTFUL_PAINT: "largest_contentful_paint";
    readonly FIRST_INPUT_DELAY: "first_input_delay";
    readonly CUMULATIVE_LAYOUT_SHIFT: "cumulative_layout_shift";
};
export declare const TRACKED_STATUS_CODES: number[];
export declare const DEFAULT_TRACKED_ACTIONS: string[];
export declare const STORAGE_KEYS: {
    readonly SESSION: "bt_session";
    readonly SESSION_ID: "bt_session_id";
    readonly SESSION_START: "bt_session_start";
    readonly LAST_ACTIVITY: "bt_last_activity";
};
//# sourceMappingURL=defaults.d.ts.map