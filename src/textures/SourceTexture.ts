import { Texture } from "../tree/Texture";
import { TextureSource } from "../tree/TextureSource";

export class SourceTexture extends Texture {
    private _textureSource?: TextureSource = undefined;

    get textureSource(): TextureSource | undefined {
        return this._textureSource;
    }

    set textureSource(v: TextureSource | undefined) {
        if (v !== this._textureSource) {
            if (v && v.isResultTexture) {
                // In case of a result texture, automatically inherit the pixel ratio.
                this.pixelRatio = this.stage.getPixelRatio();
            }
            this._textureSource = v;
            this._changed();
        }
    }

    protected _getIsValid() {
        return !!this._textureSource;
    }
}
