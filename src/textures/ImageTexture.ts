import Texture, {TextureSourceLoader} from "../tree/Texture";

export default class ImageTexture extends Texture {

    private _src?: string;
    private _hasAlpha: boolean = false;

    get src() {
        return this._src;
    }

    set src(v) {
        if (this._src !== v) {
            this._src = v;
            this._changed();
        }
    }

    get hasAlpha() {
        return this._hasAlpha;
    }

    set hasAlpha(v) {
        if (this._hasAlpha !== v) {
            this._hasAlpha = v;
            this._changed();
        }
    }

    protected _getIsValid() {
        return !!this._src;
    }

    protected _getLookupId() {
        return this._src;
    }

    protected _getSourceLoader(): TextureSourceLoader {
        let src = this._src!;
        const hasAlpha = this._hasAlpha;
        if (this.stage.getOption("srcBasePath")) {
            const fc = src.charCodeAt(0);
            if (src.indexOf("//") === -1 && ((fc >= 65 && fc <= 90) || (fc >= 97 && fc <= 122) || fc == 46)) {
                // Alphabetical or dot: prepend base path.
                src = this.stage.getOption("srcBasePath") + src;
            }
        }

        return cb => {
            return this.stage.platform.loadSrcTexture({ src: src, hasAlpha: hasAlpha }, cb);
        };
    }

    getNonDefaults() {
        const obj = super.getNonDefaults();
        if (this._src) {
            obj.src = this._src;
        }
        return obj;
    }

}
