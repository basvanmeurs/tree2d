import { Texture, TextureSourceLoader } from "../tree/Texture";
import { Utils } from "../tree/Utils";
import { ColorUtils } from "../tree/ColorUtils";
import { Stage } from "../tree/Stage";

export type RoundRectOptions = {
    w: number;
    h: number;
    radius: number[];
    strokeWidth: number;
    strokeColor: string | number;
    fill: boolean;
    fillColor: string | number;
    shadowBlur: number;
    shadowColor: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
};

export class RoundRectTexture extends Texture {
    private _options?: Partial<RoundRectOptions> = undefined;

    constructor(stage: Stage) {
        super(stage);
        this.pixelRatio = this.stage.pixelRatio;
    }

    set options(options: Partial<RoundRectOptions> | undefined) {
        this._options = options;
        this._changed();
    }

    get options(): Partial<RoundRectOptions> | undefined {
        return this._options;
    }

    protected _getIsValid() {
        return !!this._options && !!this._options.w && !!this._options.h;
    }

    protected _getLookupId() {
        return "RC$" + Texture.getLookupIdFromSettings(this._options!) + "|" + this.pixelRatio;
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const options = Utils.clone(this._options);
        const pixelRatio = this.pixelRatio;
        return (cb) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            const renderInfo = RoundRectTexture.drawOnCanvas(canvas, options, pixelRatio);
            cb(undefined, { source: canvas, renderInfo });
        };
    }

    private static drawOnCanvas(canvas: HTMLCanvasElement, options: RoundRectOptions, pixelRatio: number): any {
        let {
            w,
            h,
            radius = [0, 0, 0, 0],
            strokeWidth = 0,
            shadowBlur = 0,
            shadowOffsetX = 0,
            shadowOffsetY = 0,
        } = options;

        const { strokeColor, fill = true, fillColor = 0xffffffff, shadowColor = 0xffffffff } = options;

        w *= pixelRatio;
        h *= pixelRatio;
        radius = radius.map((r: number) => r * pixelRatio);
        strokeWidth *= pixelRatio;
        shadowBlur *= pixelRatio;
        shadowOffsetX *= pixelRatio;
        shadowOffsetY *= pixelRatio;

        const context = canvas.getContext("2d")!;
        context.imageSmoothingEnabled = true;

        canvas.width = w + strokeWidth + 2 + shadowBlur * 2 + Math.abs(shadowOffsetX);
        canvas.height = h + strokeWidth + 2 + shadowBlur * 2 + Math.abs(shadowOffsetY);

        context.beginPath();
        const x = 0.5 * strokeWidth + 1 + shadowBlur - Math.max(0, shadowOffsetX);
        const y = 0.5 * strokeWidth + 1 + shadowBlur - Math.max(0, shadowOffsetY);

        context.moveTo(x + radius[0], y);
        context.lineTo(x + w - radius[1], y);
        context.arcTo(x + w, y, x + w, y + radius[1], radius[1]);
        context.lineTo(x + w, y + h - radius[2]);
        context.arcTo(x + w, y + h, x + w - radius[2], y + h, radius[2]);
        context.lineTo(x + radius[3], y + h);
        context.arcTo(x, y + h, x, y + h - radius[3], radius[3]);
        context.lineTo(x, y + radius[0]);
        context.arcTo(x, y, x + radius[0], y, radius[0]);
        context.closePath();

        if (shadowBlur) {
            context.shadowBlur = shadowBlur;
            context.shadowOffsetX = shadowOffsetX;
            context.shadowOffsetY = shadowOffsetY;
            context.shadowColor = this.convertToCanvasColor(shadowColor);
        }

        if (strokeWidth) {
            context.strokeStyle = this.convertToCanvasColor(strokeColor);
            context.lineWidth = strokeWidth;
            context.stroke();
        }

        if (fill) {
            context.fillStyle = this.convertToCanvasColor(fillColor);
            context.fill();
        }

        return { offsetX: x / pixelRatio, offsetY: y / pixelRatio };
    }

    private static convertToCanvasColor(c: number | string): string {
        if (Utils.isNumber(c)) {
            return ColorUtils.getRgbaString(c);
        } else {
            return c;
        }
    }
}
