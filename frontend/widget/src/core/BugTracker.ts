import { BugTrackerConfig } from '../types/config';
import { InternalEvent } from '../types/events';
import { SessionManager } from './SessionManager';
import { EventBuffer } from './EventBuffer';
import { ErrorCatcher } from './ErrorCatcher';
import { NetworkMonitor } from './NetworkMonitor';
import { UserActionTracker } from './UserActionTracker';
import { WidgetButton } from '../ui/WidgetButton';
import { Client } from '../api/Client';
import { BugReportModal } from '../ui/BugReportModal';
import { BeaconClient } from '../api/BeaconClient';
import { DEFAULT_FLUSH_INTERVAL, DEFAULT_MAX_BUFFER_SIZE } from '../constants/defaults';

export class BugTracker {
    private config: BugTrackerConfig;
    private sessionManager: SessionManager;
    private eventBuffer: EventBuffer;
    private errorCatcher: ErrorCatcher;
    private networkMonitor: NetworkMonitor | null = null;
    private userActionTracker: UserActionTracker | null = null;
    private widgetButton: WidgetButton;
    private client: Client;
    private beaconClient: BeaconClient;
    private flushTimer: number | null = null;
    private isInitialized: boolean = false;

    constructor(config: BugTrackerConfig) {
        // Validate config
        // Accept numeric projectId (including 0) and non-empty string; only reject null/undefined
        if (config.projectId === undefined || config.projectId === null) throw new Error('projectId is required');
        if (!config.apiUrl) throw new Error('apiUrl is required');

        // Set defaults
        this.config = {
            maxBufferSize: DEFAULT_MAX_BUFFER_SIZE,
            flushInterval: DEFAULT_FLUSH_INTERVAL,
            captureUserActions: true,
            captureNetworkErrors: true,
            buttonPosition: 'bottom-right',
            sessionTimeout: 30 * 60 * 1000,
            debug: false,
            ...config
        };

        // Initialize components
        this.client = new Client(this.config.apiUrl, this.config.projectId);
        this.beaconClient = new BeaconClient(this.config.apiUrl);
        this.sessionManager = new SessionManager(this.config.sessionTimeout!, this.client);

        // If integrator provided an explicit server session id (from server-side rendering), use it.
        if ((this.config as any).sessionId !== undefined && (this.config as any).sessionId !== null) {
            const sid = Number((this.config as any).sessionId);
            if (!Number.isNaN(sid)) {
                this.sessionManager.setServerSessionId(sid);
            }
        }

        this.eventBuffer = new EventBuffer(
            this.config.maxBufferSize!,
            this.flushEvents.bind(this)
        );

        // Error catcher
        this.errorCatcher = new ErrorCatcher(
            (error, errorEvent) => this.trackJSError(error, errorEvent)
        );

        // Conditional trackers
        if (this.config.captureNetworkErrors) {
            this.networkMonitor = new NetworkMonitor(
                (details) => this.trackNetworkError(details)
            );
        }

        if (this.config.captureUserActions) {
            this.userActionTracker = new UserActionTracker(
                (action) => this.trackUserAction(action)
            );
        }

        // Widget button
        this.widgetButton = new WidgetButton(
            this.config.buttonPosition!,
            () => this.openBugReport()
        );
    }

    /**
     * Initialize tracking
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // 1. Initialize session
            if (this.config.debug) console.log('[BugTracker] initializing session...');
            let sessionId: number;
            let sessionData: any;
            try {
                sessionId = this.sessionManager.initialize();
                sessionData = this.sessionManager.getSessionData();
                if (this.config.debug) console.log('[BugTracker] session initialized:', sessionId);
            } catch (e) {
                console.error('[BugTracker] SessionManager.initialize() failed:', e);
                throw new Error(`Session initialization failed: ${e instanceof Error ? e.message : String(e)}`);
            }

            // 3. Start all trackers
            if (this.config.debug) console.log('[BugTracker] starting trackers...');
            try {
                this.errorCatcher.start();
                this.networkMonitor?.start();
                this.userActionTracker?.start();
                if (this.config.debug) console.log('[BugTracker] trackers started');
            } catch (e) {
                console.error('[BugTracker] Starting trackers failed:', e);
                throw new Error(`Starting trackers failed: ${e instanceof Error ? e.message : String(e)}`);
            }

            // 4. Create UI
            if (this.config.debug) console.log('[BugTracker] creating widget button...');
            try {
                this.widgetButton.create();
                if (this.config.debug) console.log('[BugTracker] widget button created');
            } catch (e) {
                console.error('[BugTracker] WidgetButton.create() failed:', e);
                throw new Error(`Widget creation failed: ${e instanceof Error ? e.message : String(e)}`);
            }

            // 5. Start flush timer
            if (this.config.debug) console.log('[BugTracker] starting flush timer...');
            try {
                this.startFlushTimer();
                if (this.config.debug) console.log('[BugTracker] flush timer started (if configured)');
            } catch (e) {
                console.error('[BugTracker] startFlushTimer() failed:', e);
                throw new Error(`startFlushTimer failed: ${e instanceof Error ? e.message : String(e)}`);
            }

            // 6. Setup page unload
            if (this.config.debug) console.log('[BugTracker] setting up unload handler...');
            try {
                this.setupPageUnloadHandler();
                if (this.config.debug) console.log('[BugTracker] unload handler set');
            } catch (e) {
                console.error('[BugTracker] setupPageUnloadHandler() failed:', e);
                throw new Error(`setupPageUnloadHandler failed: ${e instanceof Error ? e.message : String(e)}`);
            }

            this.isInitialized = true;

            if (this.config.debug) {
                console.log('BugTracker initialized');
            }

        } catch (error) {
            console.error('BugTracker initialization failed:', error);
            throw error;
        }
    }

    private trackJSError(error: Error, errorEvent?: {
        type: "window" | "promise" | "console";
        event?: ErrorEvent;
        reason?: any
    } | undefined): void {
        // Extract error details from the ErrorEvent if available
        const errorEventDetails = errorEvent?.event;

        const event: InternalEvent = {
            type: 'ERROR' as any,
            name: error.name,
            message: error.message,
            stackTrace: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            // Access properties from the actual ErrorEvent object
            lineNumber: errorEventDetails?.lineno,
            columnNumber: errorEventDetails?.colno,
            fileName: errorEventDetails?.filename,
            customMetadata: {
                errorType: 'JS_ERROR',
                // Add the error event type for debugging
                errorSource: errorEvent?.type
            }
        };

        this.addEvent(event);
    }

    private trackNetworkError(details: {
        type: "fetch" | "xhr";
        url: string;
        method: string;
        status: number;
        statusText: string;
        duration: number;
        error?: Error;
        requestBody?: any;
        responseBody?: any
    }): void {
        const event: InternalEvent = {
            type: 'NETWORK' as any,
            name: `Network ${details.status}`,
            // Convert Error to string if it exists
            message: details.error ? details.error.message : undefined,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            networkUrl: details.url,
            statusCode: details.status,
            duration: details.duration,
            customMetadata: {
                method: details.method,
                // Include full error details in metadata if needed
                ...(details.error && {
                    errorName: details.error.name,
                    errorStack: details.error.stack,
                    statusText: details.statusText
                })
            }
        };

        this.addEvent(event);
    }

    /**
     * Track User Action
     */
    private trackUserAction(action: {
        type: string;
        element: Element;
        event: Event;
    }): void {
        const element = action.element as HTMLElement;

        // Collect action-specific attributes
        const additionalMetadata: Record<string, any> = {};

        try {
            if (element.id) {
                additionalMetadata.elementId = element.id;
            }
            if (element.className) {
                additionalMetadata.elementClass = element.className;
            }

            if (element instanceof HTMLAnchorElement) {
                additionalMetadata.href = element.href;
                // Also include target attribute if present
                if (element.target) additionalMetadata.target = element.target;
            }

            if (element instanceof HTMLFormElement) {
                additionalMetadata.action = element.action;
                additionalMetadata.method = element.method;
            }

            if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
                additionalMetadata.inputName = (element as HTMLInputElement).name || undefined;
                additionalMetadata.inputType = (element as HTMLInputElement).type || undefined;
                // Don't send full values for privacy; truncate to 15 chars
                additionalMetadata.value = ((element as HTMLInputElement).value ?? '').toString().substring(0, 15);

                // Capture placeholder if present
                if ('placeholder' in element && element.placeholder) {
                    additionalMetadata.placeholder = element.placeholder;
                }
            }

            if (element instanceof HTMLButtonElement) {
                additionalMetadata.buttonType = element.type;
            }

            // Include dataset attributes (shallow copy)
            if (element.dataset && Object.keys(element.dataset).length > 0) {
                additionalMetadata.dataset = { ...element.dataset };
            }
        } catch (e) {
            // Defensive: accessing some properties may throw in very old or exotic environments
            console.debug('[BugTracker] Failed to extract element attributes for action metadata:', e);
        }

        const event: InternalEvent = {
            type: 'ACTION' as any,
            name: `User ${action.type}`,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            tagName: element.tagName,
            xPath: this.getElementXPath(element),
            customMetadata: {
                //elementId: element.id || undefined,
                //elementClass: element.className || undefined,
                textContent: element.textContent?.substring(0, 100),
                eventType: action.event.type,
                ...additionalMetadata
            }
        };

        this.addEvent(event);
    }

    /**
     * Public API: Track custom event
     */
    public trackEvent(name: string, metadata?: Record<string, any>): void {
        const event: InternalEvent = {
            type: 'CUSTOM' as any,
            name,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            customMetadata: metadata
        };

        this.addEvent(event);
    }

    /**
     * Public API: Capture error manually
     */
    public captureError(error: Error, metadata?: Record<string, any>): void {
        const event: InternalEvent = {
            type: 'ERROR' as any,
            name: error.name,
            message: error.message,
            stackTrace: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            customMetadata: {
                ...metadata,
                capturedManually: true
            }
        };

        this.addEvent(event);
    }

    /**
     * Add event to buffer
     */
    private addEvent(event: InternalEvent): void {
        // The EventBuffer expects InternalEvent objects (with `customMetadata`).
        // Previously we transformed the shape into `metadata` which the Client did not read,
        // causing `log`, `stackTrace`, and element details to be empty on the server.
        // Pass the original event through unchanged so the Client can access message,
        // stackTrace and customMetadata when building the outgoing payload.
        this.eventBuffer.add(event);
    }

    /**
     * Flush events to backend
     */
    private async flushEvents(events: InternalEvent[]): Promise<void> {
        if (events.length === 0) return;

        try {
            const response = await this.client.sendEvents(
                events,
                this.sessionManager.getSessionId(),
                this.sessionManager.getSessionData()
            );

            if (this.config.debug) {
                console.log(`Flushed ${events.length} events:`, response);
            }

        } catch (error) {
            console.error('Failed to flush events:', error);
            // Buffer will retry on next flush
            throw error;
        }
    }

    /**
     * Open bug report modal
     */
    private async openBugReport(): Promise<void> {
        /*
        // Import dynamically to reduce initial bundle size
        let BugReportModalModule;
        try {
            BugReportModalModule = await import('../ui/BugReportModal');
        } catch (e) {
            // Log the error, emit a lightweight internal event and abort opening modal
            console.error('[BugTracker] Failed to load BugReportModal chunk:', e);
            try {
                // Track a custom event so integrators see the failure in their dashboards if events are sent
                this.trackEvent('BugReportModalLoadFailed', { error: e instanceof Error ? e.message : String(e) });
            } catch (err) {
                // swallow - we don't want tracking failure to throw
                console.debug('[BugTracker] Failed to track BugReportModalLoadFailed:', err);
            }
            return;
        }

        const { BugReportModal } = BugReportModalModule;*/

        // Get numeric session ID for the report
        const sessionId = Number(this.sessionManager.getSessionId());
        const projectId = String(this.config.projectId);

        const modal = new BugReportModal(
            this.beaconClient,
            this.client,
            projectId,
            sessionId,
            async () => {
                // onClose callback - executed after successful submission
                // Flush current events before ending session
                await this.eventBuffer.flush();

                // Track as custom event
                this.trackEvent('BugReportSubmitted', {});

                // Flush this event so it's definitely sent for the session that just reported
                try {
                    await this.eventBuffer.flush();
                } catch (e) {
                    console.error('[BugTracker] Failed to flush events after BugReportSubmitted:', e);
                }

                // End the current session and immediately create a fresh one
                try {
                    if (this.config.debug) console.log('[BugTracker] ending current session after report...');
                    this.sessionManager.endSession();
                } catch (e) {
                    console.error('[BugTracker] Failed to end session after report:', e);
                }

                try {
                    if (this.config.debug) console.log('[BugTracker] creating new session after report...');
                    const newLocalId = this.sessionManager.initialize();
                    if (this.config.debug) console.log('[BugTracker] new session id:', newLocalId);
                } catch (e) {
                    console.error('[BugTracker] Failed to create a new session after report:', e);
                }

                if (this.config.debug) {
                    console.log('Bug report sent successfully');
                }
            }
        );

        await modal.open(); // Modal.open is async
    }

    private startFlushTimer(): void {
        if (this.flushTimer) clearInterval(this.flushTimer);

        // Only set up periodic flush if flushInterval is a positive number
        if (this.config.flushInterval && this.config.flushInterval > 0) {
            this.flushTimer = window.setInterval(() => {
                this.eventBuffer.flush();
            }, this.config.flushInterval!);
        }

        // Flush when tab becomes hidden, but only if there are urgent events
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (this.eventBuffer.hasUrgentEvents()) {
                    // Fire-and-forget; errors are handled inside EventBuffer.flush
                    void this.eventBuffer.flush().catch(() => { /* swallow - buffer restored on failure */ });
                }
            }
        });
    }

    /**
     * Setup page unload handler with Beacon API
     */
    private setupPageUnloadHandler(): void {
        window.addEventListener('beforeunload', () => {
            const events = this.eventBuffer.getEvents();
            // Only send via beacon if there are urgent events
            const shouldFlush = this.eventBuffer.hasUrgentEvents();
            if (shouldFlush && events.length > 0) {
                this.client.sendEventsWithBeacon(
                    events,
                    this.sessionManager.getSessionId(),
                    this.sessionManager.getSessionData()
                );
            }

            // Do NOT end the session on unload; we persist server session id to localStorage so other pages/tabs
            // will reuse it. The session will be ended by server-side timeout or explicit endSession() call.
        });
    }

    /**
     * Utility: Get element XPath
     */
    private getElementXPath(element: Element): string {
        if (element.id) return `//*[@id="${element.id}"]`;

        const parts: string[] = [];
        let current: Element | null = element;

        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let index = 0;
            const siblings: HTMLCollectionOf<Element> = (current.parentNode?.children || []) as HTMLCollectionOf<Element>;

            for (let i = 0; i < siblings.length; i++) {
                if (siblings[i] === current) {
                    parts.unshift(`${current.tagName.toLowerCase()}[${index + 1}]`);
                    break;
                }
                if (siblings[i].tagName === current.tagName) {
                    index++;
                }
            }

            current = current.parentElement;
        }

        return parts.length ? '/' + parts.join('/') : '';
    }

    /**
     * Public API: Destroy and cleanup
     */
    public destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        this.errorCatcher.stop();
        this.networkMonitor?.stop();
        this.userActionTracker?.stop();

        this.widgetButton.destroy();

        // Remove event listeners
        window.removeEventListener('beforeunload', this.eventBuffer.flush);
        document.removeEventListener('visibilitychange', this.eventBuffer.flush);

        this.isInitialized = false;
    }

    /**
     * Public API: Get current session ID
     */
    public getSessionId(): number {
        return this.sessionManager.getSessionId();
    }

    /**
     * Public API: Manually flush events
     */
    public async flush(): Promise<void> {
        await this.eventBuffer.flush();
    }

    /**
     * Public helper: wait until server-created session id (numeric) is available.
     * Returns the numeric session id or null if timed out.
     */
    public async waitForServerSession(timeoutMs: number = 5000): Promise<number | null> {
        const pollInterval = 200;
        const start = Date.now();

        return new Promise<number | null>((resolve) => {
            const check = () => {
                if (this.sessionManager.isServerBacked()) {
                    resolve(this.sessionManager.getSessionId());
                    return;
                }

                if (Date.now() - start >= timeoutMs) {
                    resolve(null);
                    return;
                }

                setTimeout(check, pollInterval);
            };

            check();
        });
    }

    /**
     * Public helper: attempt to create a server session immediately and return the numeric server id or null.
     * Useful for debugging network/CORS issues from the console: call window._bt.ensureServerSession().
     */
    public async ensureServerSession(): Promise<number | null> {
        if (!this.client) return null;

        try {
            const localId = this.sessionManager.getSessionId();
            const sessionData = this.sessionManager.getSessionData();

            console.debug('[BugTracker] ensureServerSession: sending POST to /api/sessions for local id', localId);

            const created = await this.client.sendSessionStart(String(localId), sessionData);
            if (created !== null && !Number.isNaN(Number(created))) {
                this.sessionManager.setServerSessionId(Number(created));
                console.debug('[BugTracker] ensureServerSession: server session created', created);
                return Number(created);
            }

            console.debug('[BugTracker] ensureServerSession: server did not return a session id');
            return null;
        } catch (e) {
            console.error('[BugTracker] ensureServerSession failed:', e);
            return null;
        }
    }
}