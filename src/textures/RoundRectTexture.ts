import Texture, { TextureSourceLoader } from '../tree/Texture';
import Utils from '../tree/Utils';
import ColorUtils from '../tree/ColorUtils';

export type RoundRectOptions = {
    w: number;
    h: number;
    radius: number[];
    strokeWidth: number;
    strokeColor: string | number;
    fill: boolean;
    fillColor: string | number;
};

export default class RoundRectTexture extends Texture {
    private _options?: RoundRectOptions;

    set options(options: RoundRectOptions | undefined) {
        this._options = options;
        this._changed();
    }

    get options(): RoundRectOptions | undefined {
        return this._options;
    }

    protected _getIsValid() {
        return !!this._options;
    }

    protected _getLookupId() {
        const { w, h, radius, strokeWidth, strokeColor, fill, fillColor } = this._options!;
        return 'rect' + [w, h, strokeWidth, strokeColor, fill ? 1 : 0, fillColor].concat(radius).join(',');
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const options = Utils.clone(this._options);
        return cb => {
            const canvas = this.stage.platform.getDrawingCanvas();
            RoundRectTexture.drawOnCanvas(canvas, options);
            cb(undefined, { source: canvas });
        };
    }

    private static drawOnCanvas(canvas: HTMLCanvasElement, options: RoundRectOptions) {
        const { w, h, radius, strokeColor, strokeWidth = 0, fill = true, fillColor } = options;

        const context = canvas.getContext('2d')!;
        context.imageSmoothingEnabled = true;

        canvas.width = w + strokeWidth + 2;
        canvas.height = h + strokeWidth + 2;

        context.beginPath();
        const x = 0.5 * strokeWidth + 1;
        const y = 0.5 * strokeWidth + 1;

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

        if (fill) {
            if (Utils.isNumber(fillColor)) {
                context.fillStyle = ColorUtils.getRgbaString(fillColor);
            } else {
                context.fillStyle = 'white';
            }
            context.fill();
        }

        if (strokeWidth) {
            if (Utils.isNumber(strokeColor)) {
                context.strokeStyle = ColorUtils.getRgbaString(strokeColor);
            } else {
                context.strokeStyle = 'white';
            }
            context.lineWidth = strokeWidth;
            context.stroke();
        }
    }
}
