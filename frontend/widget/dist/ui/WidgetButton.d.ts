export declare class WidgetButton {
    private button;
    private position;
    private text;
    private onClick;
    private isVisible;
    private styles;
    constructor(position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | undefined, onClick: () => void, text?: string);
    create(): void;
    private applyStyles;
    private applyPosition;
    private addEventListeners;
    private addGlobalStyles;
    show(): void;
    hide(): void;
    toggle(): void;
    setText(text: string): void;
    setPosition(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): void;
    updateStyles(styles: {
        base?: Partial<CSSStyleDeclaration>;
        hover?: Partial<CSSStyleDeclaration>;
        active?: Partial<CSSStyleDeclaration>;
    }): void;
    destroy(): void;
    exists(): boolean;
    isButtonVisible(): boolean;
    getButtonElement(): HTMLButtonElement | null;
}
//# sourceMappingURL=WidgetButton.d.ts.map