import Texture, { TextureSourceLoader } from '../tree/Texture';

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
    const src = this._src!;
    const hasAlpha = this._hasAlpha;

    return cb => {
      return this.stage.platform.loadSrcTexture({ src, hasAlpha }, cb);
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
