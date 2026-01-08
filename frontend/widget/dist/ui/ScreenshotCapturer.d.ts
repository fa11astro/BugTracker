declare global {
    interface Window {
        html2canvas?: Html2Canvas;
    }
}
export type Html2Canvas = (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
export declare class ScreenshotCapturer {
    private html2canvas;
    private defaultOptions;
    private cdnUrl;
    private loadingPromise;
    constructor();
    private setDefaultOptions;
    private checkAvailability;
    private ensureHtml2Canvas;
    isHtml2CanvasAvailable(): boolean;
    setOptions(opts: Partial<any>): void;
    getOptions(): any;
    private capture;
    capturePreview(target?: HTMLElement): Promise<string>;
    captureFinal(target?: HTMLElement): Promise<string>;
    captureViewport(): Promise<string>;
    dataUrlToBlob(dataUrl: string): Promise<Blob | null>;
}
//# sourceMappingURL=ScreenshotCapturer.d.ts.map