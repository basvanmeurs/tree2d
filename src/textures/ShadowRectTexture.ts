import Texture, {TextureSourceLoader} from "../tree/Texture";
import Utils from "../tree/Utils";
import StageUtils from "../tree/StageUtils";

export type ShadowRectOptions = {w: number, h: number, radius: number[], blur: number, margin: number};

export default class ShadowRectTexture extends Texture {

    private _options? : ShadowRectOptions;

    set options(options: ShadowRectOptions | undefined) {
        this._options = options;
        this._changed();
    }

    get options() : ShadowRectOptions | undefined {
        return this._options;
    }

    protected _getIsValid() {
        return !!this._options;
    }

    protected _getLookupId() {
        const {w, h, radius, blur, margin} = this._options!;
        return "shadow" + [w, h, blur, margin].concat(radius).join(",");
    }

    protected _getSourceLoader() : TextureSourceLoader {
        const options = Utils.clone(this._options);
        return cb => {
            const canvas = this.stage.platform.getDrawingCanvas();
            ShadowRectTexture.drawOnCanvas(canvas, options);
            cb(undefined, {source: canvas})
        };
    }

    private static drawOnCanvas(canvas: HTMLCanvasElement, options: ShadowRectOptions) {
        let {w, h, radius, blur, margin} = options;

        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;

        canvas.width = w + margin * 2;
        canvas.height = h + margin * 2;

        // WpeWebKit bug: we experienced problems without this with shadows in noncompositedwebgl mode.
        ctx.globalAlpha = 0.01;
        ctx.fillRect(0, 0, 0.01, 0.01);
        ctx.globalAlpha = 1.0;

        ctx.shadowColor = StageUtils.getRgbaString(0xffffffff);
        ctx.fillStyle = StageUtils.getRgbaString(0xffffffff);
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = w + 10 + margin;
        ctx.shadowOffsetY = margin;

        ctx.beginPath();
        const x = -(w + 10);
        const y = 0;

        ctx.moveTo(x + radius[0], y);
        ctx.lineTo(x + w - radius[1], y);
        ctx.arcTo(x + w, y, x + w, y + radius[1], radius[1]);
        ctx.lineTo(x + w, y + h - radius[2]);
        ctx.arcTo(x + w, y + h, x + w - radius[2], y + h, radius[2]);
        ctx.lineTo(x + radius[3], y + h);
        ctx.arcTo(x, y + h, x, y + h - radius[3], radius[3]);
        ctx.lineTo(x, y + radius[0]);
        ctx.arcTo(x, y, x + radius[0], y, radius[0]);
        ctx.closePath();
        ctx.fill();
    }

}
