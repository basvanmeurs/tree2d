import Texture from '../tree/Texture';
import TextureSource from '../tree/TextureSource';

export default class SourceTexture extends Texture {
  private _textureSource?: TextureSource;

  get textureSource(): TextureSource | undefined {
    return this._textureSource;
  }

  set textureSource(v: TextureSource | undefined) {
    if (v !== this._textureSource) {
      if (v && v.isResultTexture) {
        // In case of a result texture, automatically inherit the precision.
        this.precision = this.stage.getRenderPrecision();
      }
      this._textureSource = v;
      this._changed();
    }
  }

  protected _getIsValid() {
    return !!this._textureSource;
  }
}
