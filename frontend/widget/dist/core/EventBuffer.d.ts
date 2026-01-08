import { InternalEvent } from '../types/events';
export declare class EventBuffer {
    private buffer;
    private maxSize;
    private onFlush;
    constructor(maxSize: number, onFlush: (events: InternalEvent[]) => Promise<void>);
    add(event: InternalEvent): void;
    flush(): Promise<void>;
    getEvents(): InternalEvent[];
    clear(): void;
    get size(): number;
    isEmpty(): boolean;
    isFull(): boolean;
    hasUrgentEvents(): boolean;
}
//# sourceMappingURL=EventBuffer.d.ts.map