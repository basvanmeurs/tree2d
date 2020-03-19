import TextureSource from './TextureSource';
import Stage from './Stage';
import { TextureSourceLoader, TextureSourceOptions } from './Texture';

export default class TextureManager {
  // The currently used amount of texture memory.
  private _usedMemory: number = 0;

  // All texture sources that are uploaded to the GPU.
  private _uploadedTextureSources: TextureSource[] = [];

  // The texture source lookup id to texture source hashmap.
  private textureSourceHashmap = new Map<string, TextureSource>();

  constructor(private stage: Stage) {}

  get usedMemory() {
    return this._usedMemory;
  }

  destroy() {
    for (let i = 0, n = this._uploadedTextureSources.length; i < n; i++) {
      this._nativeFreeTextureSource(this._uploadedTextureSources[i]);
    }

    this.textureSourceHashmap.clear();
    this._usedMemory = 0;
  }

  getReusableTextureSource(id: string): TextureSource | undefined {
    return this.textureSourceHashmap.get(id);
  }

  getTextureSource(loader: TextureSourceLoader, lookupId: string | undefined) {
    // Check if texture source is already known.
    let textureSource = lookupId ? this.textureSourceHashmap.get(lookupId) : undefined;
    if (!textureSource) {
      // Create new texture source.
      textureSource = new TextureSource(this, loader);

      if (lookupId) {
        textureSource.lookupId = lookupId;
        this.textureSourceHashmap.set(lookupId, textureSource);
      }
    }

    return textureSource;
  }

  uploadTextureSource(textureSource: TextureSource, options: TextureSourceOptions) {
    if (textureSource.isLoaded()) return;

    this._addMemoryUsage(textureSource.w * textureSource.h);

    // Load texture.
    const nativeTexture = this._nativeUploadTextureSource(textureSource, options);

    textureSource._nativeTexture = nativeTexture;

    // We attach w and h to native texture (we need it in CoreRenderState._isRenderTextureReusable).
    nativeTexture.w = textureSource.w;
    nativeTexture.h = textureSource.h;

    nativeTexture.updateFrame = this.stage.frameCounter;

    this._uploadedTextureSources.push(textureSource);

    this.addToLookupMap(textureSource);
  }

  private _addMemoryUsage(delta: number) {
    this._usedMemory += delta;
    this.stage.addMemoryUsage(delta);
  }

  addToLookupMap(textureSource: TextureSource) {
    const lookupId = textureSource.lookupId;
    if (lookupId) {
      if (!this.textureSourceHashmap.has(lookupId)) {
        this.textureSourceHashmap.set(lookupId, textureSource);
      }
    }
  }

  gc() {
    this.freeUnusedTextureSources();
    this._cleanupLookupMap();
  }

  private freeUnusedTextureSources() {
    const remainingTextureSources = [];
    for (let i = 0, n = this._uploadedTextureSources.length; i < n; i++) {
      const ts = this._uploadedTextureSources[i];
      if (ts.allowCleanup()) {
        this._freeManagedTextureSource(ts);
      } else {
        remainingTextureSources.push(ts);
      }
    }

    this._uploadedTextureSources = remainingTextureSources;

    this._cleanupLookupMap();
  }

  private _freeManagedTextureSource(textureSource: TextureSource) {
    if (textureSource.isLoaded()) {
      this._nativeFreeTextureSource(textureSource);
      this._addMemoryUsage(-textureSource.w * textureSource.h);
    }

    // Should be reloaded.
    textureSource.setNotLoaded();
  }

  private _cleanupLookupMap() {
    // We keep those that still have value (are being loaded or already loaded, or are likely to be reused).
    this.textureSourceHashmap.forEach((textureSource, lookupId) => {
      if (!(textureSource.isLoaded() || textureSource.isLoading()) && !textureSource.isUsed()) {
        this.textureSourceHashmap.delete(lookupId);
      }
    });
  }

  freeTextureSource(textureSource: TextureSource) {
    const index = this._uploadedTextureSources.indexOf(textureSource);
    const managed = index !== -1;

    if (textureSource.isLoaded()) {
      if (managed) {
        this._addMemoryUsage(-textureSource.w * textureSource.h);
        this._uploadedTextureSources.splice(index, 1);
      }
      this._nativeFreeTextureSource(textureSource);
    }

    // Should be reloaded.
    textureSource.setNotLoaded();
  }

  private _nativeUploadTextureSource(textureSource: TextureSource, options: TextureSourceOptions) {
    return this.stage.renderer.uploadTextureSource(textureSource, options);
  }

  private _nativeFreeTextureSource(textureSource: TextureSource) {
    this.stage.renderer.freeTextureSource(textureSource);
    textureSource.clearNativeTexture();
  }

  getStage() {
    return this.stage;
  }
}
