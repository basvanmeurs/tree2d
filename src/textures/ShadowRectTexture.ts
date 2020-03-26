import Texture, { TextureSourceLoader } from "../tree/Texture";
import Utils from "../tree/Utils";
import ColorUtils from "../tree/ColorUtils";

export type ShadowRectOptions = { w: number; h: number; radius: number[]; blur: number; margin: number };

export default class ShadowRectTexture extends Texture {
    private _options?: ShadowRectOptions;

    set options(options: ShadowRectOptions | undefined) {
        this._options = options;
        this._changed();
    }

    get options(): ShadowRectOptions | undefined {
        return this._options;
    }

    protected _getIsValid() {
        return !!this._options;
    }

    protected _getLookupId() {
        const { w, h, radius, blur, margin } = this._options!;
        return "shadow" + [w, h, blur, margin].concat(radius).join(",");
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const options = Utils.clone(this._options);
        return (cb) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            ShadowRectTexture.drawOnCanvas(canvas, options);
            cb(undefined, { source: canvas });
        };
    }

    private static drawOnCanvas(canvas: HTMLCanvasElement, options: ShadowRectOptions) {
        const { w, h, radius, blur, margin } = options;

        const context = canvas.getContext("2d")!;
        context.imageSmoothingEnabled = true;

        canvas.width = w + margin * 2;
        canvas.height = h + margin * 2;

        // WpeWebKit bug: we experienced problems without this with shadows in noncompositedwebgl mode.
        context.globalAlpha = 0.01;
        context.fillRect(0, 0, 0.01, 0.01);
        context.globalAlpha = 1.0;

        context.shadowColor = ColorUtils.getRgbaString(0xffffffff);
        context.fillStyle = ColorUtils.getRgbaString(0xffffffff);
        context.shadowBlur = blur;
        context.shadowOffsetX = w + 10 + margin;
        context.shadowOffsetY = margin;

        context.beginPath();
        const x = -(w + 10);
        const y = 0;

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
        context.fill();
    }
}
