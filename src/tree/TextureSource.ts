import TextureManager from './TextureManager';
import Element from './Element';

export default class TextureSource {
  private id: number = TextureSource.id++;

  private static id = 0;

  // All enabled textures (textures that are used by visible elements).
  private textures = new Set<Texture>();

  // The number of active textures (textures that have at least one active element).
  private _activeTextureCount: number = 0;

  // Reuse identifier.
  public lookupId?: string;

  // If set, this.is called when the texture source is no longer displayed (activeTextureCount becomes 0).
  private _cancelCb?: (ts: TextureSource) => void;

  // Loading since timestamp in millis. If set, it is currently loading or loaded. If 0, this is currently not loading.
  private loadingSince: number = 0;

  public w: number = 0;
  public h: number = 0;

  public _nativeTexture?: NativeTexture;

  // If true, then this.texture source is never freed from memory during garbage collection.
  public permanent: boolean = false;

  // Texture-specific rendering info.
  private renderInfo?: any;

  // Render-to-texture reuse.
  private _isResultTexture: boolean = !this.loader;

  // Contains the load error, if the texture source could previously not be loaded.
  private _loadError?: Error;

  constructor(private manager: TextureManager, private loader?: TextureSourceLoader) {}

  private get stage(): Stage {
    return this.manager.getStage();
  }

  get loadError(): Error | undefined {
    return this._loadError;
  }

  addTexture(v: Texture) {
    if (!this.textures.has(v)) {
      this.textures.add(v);
    }
  }

  removeTexture(v: Texture) {
    this.textures.delete(v);
  }

  incActiveTextureCount() {
    this._activeTextureCount++;
    if (this._activeTextureCount === 1) {
      this.becomesUsed();
    }
  }

  decActiveTextureCount() {
    this._activeTextureCount--;
    if (this._activeTextureCount === 0) {
      this.becomesUnused();
    }
  }

  get isResultTexture() {
    return this._isResultTexture;
  }

  set isResultTexture(v) {
    this._isResultTexture = v;
  }

  forEachEnabledElement(cb: (element: Element) => void) {
    this.textures.forEach(texture => {
      texture.getElements().forEach(element => cb(element));
    });
  }

  hasEnabledElements() {
    return this.textures.size > 0;
  }

  forEachActiveElement(cb: (element: Element) => void) {
    this.textures.forEach(texture => {
      texture.getElements().forEach(element => {
        if (element.active) {
          cb(element);
        }
      });
    });
  }

  getRenderWidth() {
    return this.w;
  }

  getRenderHeight() {
    return this.h;
  }

  allowCleanup() {
    return !this.permanent && !this.isUsed();
  }

  private becomesUsed() {
    // Even while the texture is being loaded, make sure it is on the lookup map so that others can reuse it.
    this.load();
  }

  private becomesUnused() {
    this.cancel();
  }

  cancel() {
    if (this.isLoading()) {
      if (this._cancelCb) {
        this._cancelCb(this);

        // Clear callback to avoid memory leaks.
        this._cancelCb = undefined;
      }
      this.loadingSince = 0;
    }
  }

  isLoaded() {
    return !!this._nativeTexture;
  }

  isLoading() {
    return this.loadingSince > 0;
  }

  isError() {
    return !!this._loadError;
  }

  reload() {
    this.free();
    if (this.isUsed()) {
      this.load();
    }
  }

  load() {
    // From the moment of loading (when a texture source becomes used by active elements)
    if (this.isResultTexture) {
      // Element result texture source, for which the loading is managed by the core.
      return;
    }

    if (this.loader && !this._nativeTexture && !this.isLoading()) {
      this.loadingSince = new Date().getTime();
      const cancelCb = this.loader((err: Error | undefined, options?: TextureSourceOptions) => {
        // Ignore loads that come in after a cancel.
        if (this.isLoading()) {
          // Clear callback to avoid memory leaks.
          this._cancelCb = undefined;

          if (this.manager.getStage().isDestroyed()) {
            // Ignore async load when stage is destroyed.
            return;
          }
          if (err) {
            // Emit txError.
            this.onError(err);
          } else if (options && options.source) {
            this.processLoadedSource(options);
          }
        }
      }, this);

      this._cancelCb = cancelCb ? cancelCb : undefined;
    }
  }

  processLoadedSource(options: TextureSourceOptions) {
    this.loadingSince = 0;
    this.setSource(options);
  }

  setSource(options: TextureSourceOptions) {
    const source = options.source;

    this.w = (source as any).width || (options && options.width) || 0;
    this.h = (source as any).height || (options && options.height) || 0;

    if (options && options.renderInfo) {
      // Assign to id in cache so that it can be reused.
      this.renderInfo = options.renderInfo;
    }

    this.permanent = !!options.permanent;

    if (this._isNativeTexture(source)) {
      // Texture managed by caller.
      this._nativeTexture = source;

      this.w = this.w || (source as any).w;
      this.h = this.h || (source as any).h;

      // NativeTexture objects are by default;
      this.permanent = options.permanent === undefined ? false : options.permanent;
    } else {
      this.manager.uploadTextureSource(this, options);
    }

    this._loadError = undefined;

    this.onLoad();
  }

  isUsed() {
    return this._activeTextureCount > 0;
  }

  private onLoad() {
    if (this.isUsed()) {
      this.textures.forEach(texture => {
        texture.onLoad();
      });
    }
  }

  forceRenderUpdate() {
    // Userland should call this method after changing the nativeTexture manually outside of the framework
    //  (using tex[Sub]Image2d for example).

    if (this._nativeTexture) {
      // Change 'update' flag. This is currently not used by the framework but is handy in userland.
      this._nativeTexture.updateFrame = this.stage.frameCounter;
    }

    this.forEachActiveElement(function(element) {
      element.forceRenderUpdate();
    });
  }

  forceUpdateRenderCoords() {
    this.forEachActiveElement(function(element) {
      element.updateTextureCoords();
    });
  }

  get nativeTexture() {
    return this._nativeTexture;
  }

  clearNativeTexture() {
    this._nativeTexture = undefined;
  }

  /**
   * Used for result textures.
   */
  replaceNativeTexture(newNativeTexture: any, w: number, h: number) {
    const prevNativeTexture = this._nativeTexture;
    // Loaded by core.
    this._nativeTexture = newNativeTexture;
    this.w = w;
    this.h = h;

    if (!prevNativeTexture && newNativeTexture) {
      this.forEachActiveElement(element => element.onTextureSourceLoaded());
    }

    if (!newNativeTexture) {
      this.forEachActiveElement(element => element.setDisplayedTexture(undefined));
    }

    // Dimensions may be changed.
    this.forEachEnabledElement(element => element._updateTextureDimensions());
  }

  onError(e: Error) {
    this._loadError = e;
    this.loadingSince = 0;
    console.error('texture load error', e, this.lookupId);
    this.forEachActiveElement(element => element.onTextureSourceLoadError(e));
  }

  free() {
    if (this.isLoaded()) {
      this.manager.freeTextureSource(this);
    }
  }

  _isNativeTexture(source: any): source is NativeTexture {
    // @todo: improve.
    return source instanceof WebGLTexture;
  }

  setNotLoaded() {
    this.loadingSince = 0;
  }
}

import Texture, { TextureSourceLoader, TextureSourceOptions } from './Texture';
import Stage from './Stage';
import NativeTexture from '../renderer/NativeTexture';
