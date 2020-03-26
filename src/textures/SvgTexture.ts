import Texture, { TextureSourceLoader } from "../tree/Texture";
import Utils from "../tree/Utils";
import ColorUtils from "../tree/ColorUtils";

export type SvgOptions = { w: number; h: number; src: string };

export default class SvgTexture extends Texture {
    private _options?: SvgOptions;

    set options(options: SvgOptions | undefined) {
        this._options = options;
        this._changed();
    }

    get options(): SvgOptions | undefined {
        return this._options;
    }

    protected _getIsValid() {
        return !!this._options;
    }

    protected _getLookupId() {
        const { w, h, src } = this._options!;
        return "svg" + [w, h, src].join(",");
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const options = Utils.clone(this._options);
        return (cb) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            const context = canvas.getContext("2d")!;
            context.imageSmoothingEnabled = true;

            const img = new Image();
            img.onload = () => {
                canvas.width = options.w;
                canvas.height = options.h;
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                cb(undefined, { source: canvas });
            };
            img.onerror = (err) => {
                return cb(new Error("Image load error: " + err.toString()));
            };
            img.src = options.src;
        };
    }
}
