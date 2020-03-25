import ColorUtils from '../../tree/ColorUtils';
import Stage from '../../tree/Stage';
import { TextSettings } from './TextSettings';

type LinesInfo = { lines: string[]; lineWidths: number[]; maxWidth: number };

export default class TextTextureRenderer {
    private _context = this.canvas.getContext('2d')!;
    public renderInfo: any;

    constructor(
        private stage: Stage,
        private canvas: HTMLCanvasElement,
        private settings: Partial<TextSettings>,
        private precision: number,
    ) {}

    setFontProperties() {
        this._context.font = this._getFontSetting();
        if (this.settings.textBaseline) {
            this._context.textBaseline = this.settings.textBaseline;
        }
    }

    private _getFontSetting() {
        const fontStyle = this.settings.fontStyle || 'normal';
        const fontSize = (this.settings.fontSize || 40) * this.precision;
        const fontFaces = this._getFontFaces();
        return `${fontStyle} ${fontSize}px ${fontFaces.join(',')}`;
    }

    private _getFontFaces() {
        let fontFace = this.settings.fontFace;
        if (!fontFace) {
            fontFace = this.stage.defaultFontFace;
        }

        if (fontFace) {
            return fontFace.map(fontFaceName => {
                if (fontFaceName === 'serif' || fontFaceName === 'sans-serif') {
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
                if (!documentFonts.check(fontSetting, this.settings.text)) {
                    // Use a promise that waits for loading.
                    return documentFonts
                        .load(fontSetting, this.settings.text)
                        .catch(err => {
                            // Just load the fallback font.
                            console.warn('Font load error', err, fontSetting);
                        })
                        .then(() => {
                            if (!documentFonts.check(fontSetting, this.settings.text)) {
                                console.warn('Font not found', fontSetting);
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

        const precision = this.precision;

        let {
            fontSize = 40,
            wordWrapWidth = 0,
            lineHeight,
            offsetY,
            cutSx = 0,
            cutEx = 0,
            cutSy = 0,
            cutEy = 0,
        } = this.settings;

        const {
            text = '',
            textAlign = 'left',
            maxLines = 0,
            textColor = 0xffffffff,
            shadow = false,
            shadowColor = 0xff000000,
            shadowOffsetX = 0,
            shadowOffsetY = 0,
            shadowBlur = 5,
        } = this.settings;

        fontSize = fontSize * precision;
        lineHeight = lineHeight ? lineHeight * precision : lineHeight;
        offsetY = offsetY ? offsetY * precision : offsetY;
        wordWrapWidth = wordWrapWidth * precision;
        cutSx = cutSx * precision;
        cutEx = cutEx * precision;
        cutSy = cutSy * precision;
        cutEy = cutEy * precision;

        // Set font properties.
        this.setFontProperties();

        // word wrap
        // preserve original text
        const linesInfo: LinesInfo = this.wrapText(text, wordWrapWidth);
        let lines = linesInfo.lines;

        if (maxLines && lines.length > maxLines) {
            const usedLines = lines.slice(0, maxLines);
            renderInfo.moreTextLines = true;
            renderInfo.remainingLines = lines.slice(maxLines);
            lines = usedLines;
        } else {
            renderInfo.moreTextLines = false;
            renderInfo.remainingText = '';
        }

        // calculate text width
        const maxLineWidth = linesInfo.maxWidth;
        const lineWidths = linesInfo.lineWidths;

        renderInfo.lineWidths = lineWidths;
        renderInfo.maxWidth = maxLineWidth;

        // Auto-set width to max text length.
        let width = maxLineWidth;
        const innerWidth = maxLineWidth;

        // calculate text height
        lineHeight = lineHeight || fontSize;

        if (offsetY === undefined) {
            offsetY = fontSize;
        }

        let height = lineHeight * (lines.length - 1) + 0.5 * fontSize + Math.max(lineHeight, fontSize) + offsetY;

        renderInfo.w = width;
        renderInfo.h = height;
        renderInfo.lines = lines;
        renderInfo.precision = precision;

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
        this.canvas.width = Math.ceil(width);
        this.canvas.height = Math.ceil(height);

        // Canvas context has been reset.
        this.setFontProperties();

        if (cutSx || cutSy) {
            this._context.translate(-cutSx, -cutSy);
        }

        let linePositionX;
        let linePositionY;

        const drawLines = [];

        // Draw lines line by line.
        for (let i = 0, n = lines.length; i < n; i++) {
            linePositionX = 0;
            linePositionY = i * lineHeight + offsetY;

            if (textAlign === 'right') {
                linePositionX += innerWidth - lineWidths[i];
            } else if (textAlign === 'center') {
                linePositionX += (innerWidth - lineWidths[i]) / 2;
            }

            drawLines.push({ text: lines[i], x: linePositionX, y: linePositionY, w: lineWidths[i] });
        }

        // Text shadow.
        if (shadow) {
            this._context.shadowColor = ColorUtils.getRgbaString(shadowColor);
            this._context.shadowOffsetX = shadowOffsetX * precision;
            this._context.shadowOffsetY = shadowOffsetY * precision;
            this._context.shadowBlur = shadowBlur * precision;
        } else {
            this._context.shadowBlur = 0;
        }

        this._context.fillStyle = ColorUtils.getRgbaString(textColor);
        for (let i = 0, n = drawLines.length; i < n; i++) {
            const drawLine = drawLines[i];
            this._context.fillText(drawLine.text, drawLine.x, drawLine.y);
        }

        if (cutSx || cutSy) {
            this._context.translate(cutSx, cutSy);
        }

        this.renderInfo = renderInfo;
    }

    /**
     * Applies newlines to a string to have it optimally fit into the horizontal
     * bounds set by the Text object's wordWrapWidth property.
     */
    private wrapText(text: string, wordWrapWidth: number): LinesInfo {
        // Greedy wrapping algorithm that will wrap words as the line grows longer.
        // than its horizontal bounds.
        const lineItems = text.split(/\r?\n/g);
        const lines: string[] = [];
        const lineWidths: number[] = [];
        let maxWidth = 0;
        const spaceWidth = wordWrapWidth ? this._context.measureText(' ').width : 0;
        lineItems.forEach(lineItem => {
            if (wordWrapWidth) {
                let result = '';
                let lineWidth = 0;
                const words = lineItem.split(' ');
                const n = words.length;
                for (let j = 0; j < n; j++) {
                    const wordWidth = this._context.measureText(words[j]).width;
                    const overflow = lineWidth + wordWidth > wordWrapWidth;
                    if (overflow) {
                        lines.push(result);
                        lineWidths.push(lineWidth);
                        maxWidth = Math.max(maxWidth, lineWidth);
                        lineWidth = wordWidth + spaceWidth;
                        result = words[j];
                    } else {
                        if (result) {
                            result += ' ';
                        }
                        result += words[j];
                        lineWidth += wordWidth + spaceWidth;
                    }
                }
                if (n) {
                    lines.push(result);
                    lineWidths.push(lineWidth);
                    maxWidth = Math.max(maxWidth, lineWidth);
                }
            } else {
                const line = lineItem;
                const lineWidth = this._context.measureText(line).width;
                maxWidth = Math.max(maxWidth, lineWidth);
                lines.push(line);
            }
        });

        return { lines, lineWidths, maxWidth };
    }
}

function getDocumentFonts(): FontFaceSet | undefined {
    return (document as any).fonts;
}

type CSSOMString = string;
type FontFaceLoadStatus = 'unloaded' | 'loading' | 'loaded' | 'error';
type FontFaceSetStatus = 'loading' | 'loaded';

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
