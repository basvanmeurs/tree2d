import Texture, {TextureSourceLoader} from "../tree/Texture";
import Utils from "../tree/Utils";
import StageUtils from "../tree/StageUtils";

export type RoundRectOptions = {w: number, h: number, radius: number[], strokeWidth: number, strokeColor: string|number, fill: boolean, fillColor: string|number};

export default class RoundRectTexture extends Texture {

    private _options? : RoundRectOptions;

    set options(options: RoundRectOptions | undefined) {
        this._options = options;
        this._changed();
    }

    get options() : RoundRectOptions | undefined {
        return this._options;
    }

    protected _getIsValid() {
        return !!this._options;
    }

    protected _getLookupId() {
        const {w, h, radius, strokeWidth, strokeColor, fill, fillColor} = this._options!;
        return "rect" + [w, h, strokeWidth, strokeColor, fill ? 1 : 0, fillColor].concat(radius).join(",");
    }

    protected _getSourceLoader() : TextureSourceLoader {
        const options = Utils.clone(this._options);
        return cb => {
            const canvas = this.stage.platform.getDrawingCanvas();
            RoundRectTexture.drawOnCanvas(canvas, options);
            cb(undefined, {source: canvas})
        };
    }

    private static drawOnCanvas(canvas: HTMLCanvasElement, options: RoundRectOptions) {
        let {w, h, radius, strokeWidth, strokeColor, fill, fillColor} = options;

        if (fill === undefined) fill = true;
        if (strokeWidth === undefined) strokeWidth = 0;

        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = true;

        canvas.width = w + strokeWidth + 2;
        canvas.height = h + strokeWidth + 2;

        ctx.beginPath();
        const x = 0.5 * strokeWidth + 1,
            y = 0.5 * strokeWidth + 1;

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

        if (fill) {
            if (Utils.isNumber(fillColor)) {
                ctx.fillStyle = StageUtils.getRgbaString(fillColor);
            } else {
                ctx.fillStyle = "white";
            }
            ctx.fill();
        }

        if (strokeWidth) {
            if (Utils.isNumber(strokeColor)) {
                ctx.strokeStyle = StageUtils.getRgbaString(strokeColor);
            } else {
                ctx.strokeStyle = "white";
            }
            ctx.lineWidth = strokeWidth;
            ctx.stroke();
        }
    }

}
