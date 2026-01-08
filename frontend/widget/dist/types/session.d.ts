export interface SessionData {
    id: number;
    startTime: string;
    lastActivity: string;
    active: boolean;
    browser: string;
    browserVersion: string;
    os: string;
    plugins: string[];
    screenResolution: string;
    viewportSize: string;
    cookiesHash?: string;
    timezone: string;
    language: string;
    userAgent: string;
    ipAddress?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    connectionType?: string;
    memoryUsage?: string;
    url: string;
    referrer?: string;
}
//# sourceMappingURL=session.d.ts.map