import { SessionData } from '../types/session';
import type { Client } from '../api/Client';
export declare class SessionManager {
    private sessionId;
    private serverSessionId;
    private sessionData;
    private storage;
    private sessionTimeout;
    private lastActivity;
    private cleanupTimer;
    private client?;
    constructor(sessionTimeout?: number, client?: Client);
    initialize(): number;
    /**
     * Create new session with all SessionContext data
     * sync; it also attempts to create a server session asynchronously and stores that server id
     * in sessionStorage (tab-only) when available.
     */
    private createNewSession;
    private createServerSession;
    private collectSessionData;
    /**
     * Hash cookies for privacy
     */
    private hashCookies;
    private getExistingSession;
    /**
     * Check if session expired (N minutes of inactivity)
     */
    private isSessionExpired;
    updateLastActivity(): void;
    /**
     * Start cleanup timer (checks every minute)
     */
    private startCleanupTimer;
    /**
     * Reset cleanup timer
     */
    private resetCleanupTimer;
    endSession(): void;
    /**
     * Setup cross-tab sync
     */
    private setupCrossTabSync;
    /**
     * Get session ID
     */
    getSessionId(): number;
    /**
     * Set server-side session id in-memory + sessionStorage (tab-only)
     */
    setServerSessionId(id: number): void;
    /**
     * Whether the current session is backed by server-created id
     */
    isServerBacked(): boolean;
    /**
     * Get session data
     */
    getSessionData(): SessionData;
    /**
     * Check if session is active
     */
    isActive(): boolean;
}
//# sourceMappingURL=SessionManager.d.ts.map