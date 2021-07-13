import { Stage } from "../../tree/Stage";
import { TextSettings } from "./TextSettings";

export class TextTextureRenderer {
    private _context = this.canvas.getContext("2d")!;
    public renderInfo: any;

    constructor(
        private stage: Stage,
        private canvas: HTMLCanvasElement,
        private text: string,
        private settings: Partial<TextSettings>,
        private pixelRatio: number,
    ) {}

    setFontProperties() {
        this._context.font = this._getFontSetting();
    }

    private _getFontSetting() {
        const fontWeight = this.settings.fontWeight || 400;
        const fontStyle = this.settings.fontStyle || "normal";
        const fontSize = (this.settings.fontSize || 40) * this.pixelRatio;
        const fontFaces = this._getFontFaces();
        return `${fontStyle} ${fontWeight} ${fontSize}px ${fontFaces.join(",")}`;
    }

    private _getFontFaces() {
        let fontFace = this.settings.fontFace;
        if (!fontFace) {
            fontFace = this.stage.defaultFontFace;
        }

        if (fontFace) {
            return fontFace.map((fontFaceName) => {
                if (fontFaceName === "serif" || fontFaceName === "sans-serif") {
                    return fontFaceName;
                } else {
                    return `"${fontFaceName}"`;
                }
            });
        } else {
            return [];
        }
    }

    _load(): Promise<void> | undefined {
        const documentFonts = getDocumentFonts();
        if (documentFonts) {
            const fontSetting = this._getFontSetting();
            try {
                if (!documentFonts.check(fontSetting, this.text)) {
                    // Use a promise that waits for loading.
                    return documentFonts
                        .load(fontSetting, this.text)
                        .catch((err) => {
                            // Just load the fallback font.
                            console.warn("Font load error", err, fontSetting);
                        })
                        .then(() => {
                            if (!documentFonts.check(fontSetting, this.text)) {
                                console.warn("Font not found", fontSetting);
                            }
                        });
                }
            } catch (e) {
                console.warn("Can't check font loading for " + fontSetting);
            }
        }
    }

    draw(): Promise<void> | undefined {
        // We do not use a promise if possible to be able to load the texture during the current drawFrame cycle.
        const loadPromise = this._load();
        if (!loadPromise) {
            this._draw();
        } else {
            return loadPromise.then(() => {
                this._draw();
            });
        }
    }

    private _draw() {
        const renderInfo: any = {};

        const pixelRatio = this.pixelRatio;

        let { fontSize = 40, cutSx = 0, cutEx = 0, cutSy = 0, cutEy = 0, color = 'white' } = this.settings;

        const text = this.text;

        fontSize = fontSize * pixelRatio;
        cutSx = cutSx * pixelRatio;
        cutEx = cutEx * pixelRatio;
        cutSy = cutSy * pixelRatio;
        cutEy = cutEy * pixelRatio;

        // Set font properties.
        this.setFontProperties();

        const sizeInfo = this._context.measureText(text);
        renderInfo.sizeInfo = sizeInfo;

        let width = Math.ceil(sizeInfo.width);
        let height = Math.ceil(fontSize);

        renderInfo.w = width;
        renderInfo.h = height;
        renderInfo.pixelRatio = pixelRatio;

        // To prevent canvas errors.
        if (!width) width = 1;
        if (!height) height = 1;

        if (cutSx || cutEx) {
            width = Math.min(width, cutEx - cutSx);
        }

        if (cutSy || cutEy) {
            height = Math.min(height, cutEy - cutSy);
        }

        // Add extra margin to prevent issue with clipped text when scaling.
        this.canvas.width = width;
        this.canvas.height = height;

        // Canvas context has been reset.
        this.setFontProperties();

        if (cutSx || cutSy) {
            this._context.translate(-cutSx, -cutSy);
        }

        this._context.textBaseline = "top";
        this._context.fillStyle = color;
        this._context.fillText(text, 0, 0);

        if (cutSx || cutSy) {
            this._context.translate(cutSx, cutSy);
        }

        this.renderInfo = renderInfo;
    }
}

function getDocumentFonts(): FontFaceSet | undefined {
    return (document as any).fonts;
}

type CSSOMString = string;
type FontFaceLoadStatus = "unloaded" | "loading" | "loaded" | "error";
type FontFaceSetStatus = "loading" | "loaded";

interface FontFace {
    family: CSSOMString;
    style: CSSOMString;
    weight: CSSOMString;
    stretch: CSSOMString;
    unicodeRange: CSSOMString;
    variant: CSSOMString;
    featureSettings: CSSOMString;
    variationSettings: CSSOMString;
    display: CSSOMString;
    readonly status: FontFaceLoadStatus;
    readonly loaded: Promise<FontFace>;
    load(): Promise<FontFace>;
}

interface FontFaceSet {
    readonly status: FontFaceSetStatus;
    readonly ready: Promise<FontFaceSet>;
    check(font: string, text?: string): boolean;
    load(font: string, text?: string): Promise<FontFace[]>;
}
