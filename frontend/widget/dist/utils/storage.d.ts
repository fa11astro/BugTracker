export declare class Storage {
    private prefix;
    set<T>(key: string, value: T): void;
    get<T>(key: string): T | null;
    remove(key: string): void;
    clear(): void;
    setSession(session: any): void;
    getSession(): any;
    updateLastActivity(): void;
    static isAvailable(): boolean;
}
//# sourceMappingURL=storage.d.ts.map