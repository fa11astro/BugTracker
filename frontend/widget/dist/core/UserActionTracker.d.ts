export type UserActionHandler = (action: {
    type: 'click' | 'submit' | 'change' | 'keydown' | 'navigation' | string;
    element: Element;
    target: Element;
    value?: string;
    event: Event;
    metadata: {
        xPath: string;
        text: string;
        tagName: string;
        id?: string;
        className?: string;
        href?: string;
        value?: string;
        coordinates?: {
            x: number;
            y: number;
        };
        url: string;
        navigationType?: string;
        referrer?: string;
        key?: string;
        code?: string;
        interactionId?: number;
        [key: string]: any;
    };
}) => void;
export declare class UserActionTracker {
    private onAction;
    private isTracking;
    private ignoredActions;
    private trackedElements;
    private throttleDelay;
    constructor(onAction: UserActionHandler);
    start(): void;
    stop(): void;
    configure(options: {
        ignoredActions?: string[];
        throttleDelay?: number;
    }): void;
    private shouldIgnoreAction;
    private handleClick;
    private handleSubmit;
    private handleChange;
    private handleKeydown;
    private trackNavigation;
    trackManualAction(type: string, element: Element, metadata?: Record<string, any>): void;
    isActive(): boolean;
    getConfig(): {
        ignoredActions: string[];
        throttleDelay: number;
    };
}
//# sourceMappingURL=UserActionTracker.d.ts.map