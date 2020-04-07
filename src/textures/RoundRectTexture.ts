import Texture, { TextureSourceLoader } from "../tree/Texture";
import Utils from "../tree/Utils";
import ColorUtils from "../tree/ColorUtils";

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

export default class RoundRectTexture extends Texture {
    private _options?: Partial<RoundRectOptions> = undefined;

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
        const {
            w,
            h,
            radius,
            strokeWidth,
            strokeColor,
            fill,
            fillColor,
            shadowBlur,
            shadowColor,
            shadowOffsetX,
            shadowOffsetY,
        } = this._options!;
        return (
            "rect" +
            [
                w,
                h,
                strokeWidth,
                strokeColor,
                fill ? 1 : 0,
                fillColor,
                shadowBlur,
                shadowColor,
                shadowOffsetX,
                shadowOffsetY,
            ]
                .concat(radius)
                .map((v: any) => (v === undefined ? "" : "" + v))
                .join(",")
        );
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const options = Utils.clone(this._options);
        return (cb) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            const renderInfo = RoundRectTexture.drawOnCanvas(canvas, options);
            cb(undefined, { source: canvas, renderInfo });
        };
    }

    private static drawOnCanvas(canvas: HTMLCanvasElement, options: RoundRectOptions): any {
        const {
            w,
            h,
            radius = [0, 0, 0, 0],
            strokeColor,
            strokeWidth = 0,
            fill = true,
            fillColor = 0xffffffff,
            shadowBlur = 0,
            shadowColor = 0xffffffff,
            shadowOffsetX = 0,
            shadowOffsetY = 0,
        } = options;

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

        return { offsetX: x, offsetY: y };
    }

    private static convertToCanvasColor(c: number | string): string {
        if (Utils.isNumber(c)) {
            return ColorUtils.getRgbaString(c);
        } else {
            return c;
        }
    }
}
