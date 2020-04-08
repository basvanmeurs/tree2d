import Stage from "./Stage";
import Element from "./Element";

export default class Texture {
    private manager = this.stage.textureManager;

    private id: number = Texture.id++;

    public static id = 0;

    // All enabled elements that use this texture object (either as texture or displayedTexture).
    private elements = new Set<Element>();

    // The number of enabled elements that are active.
    private _activeCount: number = 0;

    private _source?: TextureSource = undefined;

    /**
     * A resize mode can be set to cover or contain a certain area.
     * It will reset the texture clipping settings.
     * Vice versa, when manual texture clipping is performed, the resizeMode is reset.
     */
    private _resizeMode?: ResizeMode = undefined;

    // Texture clipping coordinates.
    private _x: number = 0;
    private _y: number = 0;
    private _w: number = 0;
    private _h: number = 0;

    // Render precision (0.5 = fuzzy, 1 = normal, 2 = sharp even when scaled twice, etc.).
    private _pixelRatio: number = 1;

    /**
     * The (maximum) expected texture source dimensions. Used for within bounds determination while texture is not yet loaded.
     * If not set, 2048 is used by ElementCore.update.
     */
    public mw: number = 0;
    public mh: number = 0;

    // Flag that indicates that this texture uses clipping.
    private clipping: boolean = false;

    // Indicates whether this texture must update (when it becomes used again).
    private _mustUpdate: boolean = true;

    constructor(protected stage: Stage) {}

    get source(): TextureSource | undefined {
        if (this._mustUpdate || this.stage.hasUpdateTexture(this)) {
            this._performUpdateSource(true);
            this.stage.removeUpdateTexture(this);
        }
        return this._source;
    }

    getSource(): TextureSource | undefined {
        return this._source;
    }

    addElement(v: Element) {
        if (!this.elements.has(v)) {
            this.elements.add(v);

            if (this.elements.size === 1) {
                if (this._source) {
                    this._source.addTexture(this);
                }
            }

            if (v.active) {
                this.incActiveCount();
            }
        }
    }

    removeElement(v: Element) {
        if (this.elements.delete(v)) {
            if (this.elements.size === 0) {
                if (this._source) {
                    this._source.removeTexture(this);
                }
            }

            if (v.active) {
                this.decActiveCount();
            }
        }
    }

    getElements() {
        return this.elements;
    }

    incActiveCount() {
        // Ensure that texture source's activeCount has transferred ownership.
        const source = this.source;

        if (source) {
            this._checkForNewerReusableTextureSource();
        }

        this._activeCount++;
        if (this._activeCount === 1) {
            this.becomesUsed();
        }
    }

    decActiveCount() {
        const source = this.source; // Force updating the source.
        this._activeCount--;
        if (!this._activeCount) {
            this.becomesUnused();
        }
    }

    becomesUsed() {
        if (this.source) {
            this.source.incActiveTextureCount();
        }
    }

    onLoad() {
        if (this._resizeMode) {
            this._applyResizeMode();
        }

        this.elements.forEach((element) => {
            if (element.active) {
                element.onTextureSourceLoaded();
            }
        });
    }

    _checkForNewerReusableTextureSource() {
        // When this source became unused and cleaned up, it may have disappeared from the reusable texture map.
        // In the meantime another texture may have been generated loaded with the same lookup id.
        // If this is the case, use that one instead to make sure only one active texture source per lookup id exists.
        const source = this.source!;
        if (!source.isLoaded()) {
            const reusable = this._getReusableTextureSource();
            if (reusable && reusable.isLoaded() && reusable !== source) {
                this._replaceTextureSource(reusable);
            }
        } else {
            if (this._resizeMode) {
                this._applyResizeMode();
            }
        }
    }

    private becomesUnused() {
        if (this.source) {
            this.source.decActiveTextureCount();
        }
    }

    isUsed() {
        return this._activeCount > 0;
    }

    // Returns the lookup id for the current texture settings, to be able to reuse it.
    protected _getLookupId(): string | undefined {
        // Default: do not reuse texture.
        return undefined;
    }

    /**
     * Generates a loader function that is able to generate the texture for the current settings of this texture.
     * The loader itself may return a Function that is called when loading of the texture is cancelled. This can be used
     * to stop fetching an image when it is no longer in element, for example.
     */
    protected _getSourceLoader(): TextureSourceLoader {
        throw new Error("Texture.generate must be implemented.");
    }

    get isValid() {
        return this._getIsValid();
    }

    /**
     * If texture is not 'valid', no source can be created for it.
     */
    protected _getIsValid(): boolean {
        return true;
    }

    /**
     * This must be called when the texture source must be re-generated.
     */
    _changed() {
        // If no element is actively using this texture, ignore it altogether.
        if (this.isUsed()) {
            this._updateSource();
        } else {
            this._mustUpdate = true;
        }
    }

    private _updateSource() {
        // We delay all updateSource calls to the next drawFrame, so that we can bundle them.
        // Otherwise we may reload a texture more often than necessary, when, for example, patching multiple text
        // properties.
        this.stage.addUpdateTexture(this);
    }

    _performUpdateSource(force = false) {
        // If, in the meantime, the texture was no longer used, just remember that it must update until it becomes used
        // again.
        if (force || this.isUsed()) {
            this._mustUpdate = false;
            const source = this._getTextureSource();
            this._replaceTextureSource(source);
        }
    }

    private _getTextureSource(): TextureSource | undefined {
        let source;
        if (this._getIsValid()) {
            const lookupId = this._getLookupId();
            source = this._getReusableTextureSource(lookupId);
            if (!source) {
                source = this.manager.getTextureSource(this._getSourceLoader(), lookupId);
            }
        }
        return source;
    }

    private _getReusableTextureSource(lookupId = this._getLookupId()): TextureSource | undefined {
        if (this._getIsValid()) {
            if (lookupId) {
                return this.manager.getReusableTextureSource(lookupId);
            }
        }
        return undefined;
    }

    private _replaceTextureSource(newSource: TextureSource | undefined) {
        const oldSource = this._source;

        this._source = newSource;

        if (this.elements.size) {
            if (oldSource) {
                if (this._activeCount) {
                    oldSource.decActiveTextureCount();
                }

                oldSource.removeTexture(this);
            }

            if (newSource) {
                // Must happen before setDisplayedTexture to ensure sprite map texcoords are used.
                newSource.addTexture(this);
                if (this._activeCount) {
                    newSource.incActiveTextureCount();
                }
            }
        }

        if (this.isUsed()) {
            if (newSource) {
                if (newSource.isLoaded()) {
                    // Apply resizeMode
                    if (this._resizeMode) {
                        this._applyResizeMode();
                    }

                    this.elements.forEach((element) => {
                        if (element.active) {
                            element.setDisplayedTexture(this);
                        }
                    });
                } else {
                    const loadError = newSource.loadError;
                    if (loadError) {
                        this.elements.forEach((element) => {
                            if (element.active) {
                                element.onTextureSourceLoadError(loadError);
                            }
                        });
                    }
                }
            } else {
                this.elements.forEach((element) => {
                    if (element.active) {
                        element.setDisplayedTexture(undefined);
                    }
                });
            }
        }
    }

    load() {
        // Make sure that source is up to date.
        if (this.source) {
            if (!this.isLoaded()) {
                this.source.load();
            }
        }
    }

    isLoaded() {
        return this._source ? this._source.isLoaded() : false;
    }

    get loadError() {
        return this._source ? this._source.loadError : undefined;
    }

    free() {
        if (this._source) {
            this._source.free();
        }
    }

    set resizeMode(resizeMode: ResizeMode | undefined) {
        if (resizeMode) {
            this._resizeMode = resizeMode;
            if (this.isLoaded()) {
                this._applyResizeMode();
            }
        } else {
            this.disableClipping();
        }
    }

    get resizeMode(): ResizeMode | undefined {
        return this._resizeMode;
    }

    private _clearResizeMode() {
        this._resizeMode = undefined;
    }

    private _applyResizeMode() {
        if (this._resizeMode!.type === "cover") {
            this._applyResizeCover();
        } else if (this._resizeMode!.type === "contain") {
            this._applyResizeContain();
        }
        this._updatePixelRatio();
        this._updateClipping();
    }

    private _applyResizeCover() {
        const resizeMode = this._resizeMode!;
        const source = this._source!;
        const scaleX = resizeMode.w / source.w;
        const scaleY = resizeMode.h / source.h;
        const scale = Math.max(scaleX, scaleY);
        if (!scale) return;
        this._pixelRatio = 1 / scale;
        if (scaleX && scaleX < scale) {
            const desiredSize = this._pixelRatio * resizeMode.w;
            const choppedOffPixels = source.w - desiredSize;
            this._x = choppedOffPixels * resizeMode.x;
            this._w = source.w - choppedOffPixels;
        }
        if (scaleY && scaleY < scale) {
            const desiredSize = this._pixelRatio * resizeMode.h;
            const choppedOffPixels = source.h - desiredSize;
            this._y = choppedOffPixels * resizeMode.y;
            this._h = source.h - choppedOffPixels;
        }
    }

    private _applyResizeContain() {
        const resizeMode = this._resizeMode!;
        const source = this._source!;
        const scaleX = resizeMode.w / source.w;
        const scaleY = resizeMode.h / source.h;
        let scale = scaleX;
        if (!scale || scaleY < scale) {
            scale = scaleY;
        }
        if (!scale) return;
        this._pixelRatio = 1 / scale;
    }

    enableClipping(x: number, y: number, w: number, h: number) {
        this._clearResizeMode();

        x *= this._pixelRatio;
        y *= this._pixelRatio;
        w *= this._pixelRatio;
        h *= this._pixelRatio;
        if (this._x !== x || this._y !== y || this._w !== w || this._h !== h) {
            this._x = x;
            this._y = y;
            this._w = w;
            this._h = h;

            this._updateClipping();
        }
    }

    disableClipping() {
        this._clearResizeMode();

        this._x = 0;
        this._y = 0;
        this._w = 0;
        this._h = 0;

        this._updateClipping();
    }

    hasClipping() {
        return this.clipping;
    }

    private _updateClipping() {
        this.clipping = !!(this._x || this._y || this._w || this._h);

        this.elements.forEach((element) => {
            // Ignore if not the currently displayed texture.
            if (element.displayedTexture === this) {
                element.onDisplayedTextureClippingChanged();
            }
        });
    }

    private _updatePixelRatio() {
        this.elements.forEach((element) => {
            // Ignore if not the currently displayed texture.
            if (element.displayedTexture === this) {
                element.onPixelRatioChanged();
            }
        });
    }

    getNonDefaults(): any {
        const nonDefaults: Record<string, any> = {};
        nonDefaults["type"] = this.constructor.name;
        if (this.x !== 0) nonDefaults["x"] = this.x;
        if (this.y !== 0) nonDefaults["y"] = this.y;
        if (this.w !== 0) nonDefaults["w"] = this.w;
        if (this.h !== 0) nonDefaults["h"] = this.h;
        if (this.pixelRatio !== 1) nonDefaults["pixelRatio"] = this.pixelRatio;
        return nonDefaults;
    }

    get px() {
        return this._x;
    }

    get py() {
        return this._y;
    }

    get pw() {
        return this._w;
    }

    get ph() {
        return this._h;
    }

    get x() {
        return this._x / this._pixelRatio;
    }

    set x(v) {
        this._clearResizeMode();
        v = v * this._pixelRatio;
        if (this._x !== v) {
            this._x = v;
            this._updateClipping();
        }
    }

    get y() {
        return this._y / this._pixelRatio;
    }

    set y(v) {
        this._clearResizeMode();
        v = v * this._pixelRatio;
        if (this._y !== v) {
            this._y = v;
            this._updateClipping();
        }
    }

    get w() {
        return this._w / this._pixelRatio;
    }

    set w(v) {
        this._clearResizeMode();
        v = v * this._pixelRatio;
        if (this._w !== v) {
            this._w = v;
            this._updateClipping();
        }
    }

    get h() {
        return this._h / this._pixelRatio;
    }

    set h(v) {
        this._clearResizeMode();
        v = v * this._pixelRatio;
        if (this._h !== v) {
            this._h = v;
            this._updateClipping();
        }
    }

    get pixelRatio() {
        return this._pixelRatio;
    }

    set pixelRatio(v) {
        this._clearResizeMode();
        if (this._pixelRatio !== v) {
            this._pixelRatio = v;
            this._updatePixelRatio();
        }
    }

    isAutosizeTexture() {
        return true;
    }

    getRenderWidth() {
        if (!this.isAutosizeTexture()) {
            // In case of the rectangle texture, we'd prefer to not cause a 1x1 w,h as it would interfere with flex layout fit-to-contents.
            return 0;
        }

        // If dimensions are unknown (texture not yet loaded), use maximum width as a fallback as render width to allow proper bounds checking.
        return (this._w || (this._source ? this._source.getRenderWidth() - this._x : 0)) / this._pixelRatio;
    }

    getRenderHeight() {
        if (!this.isAutosizeTexture()) {
            // In case of the rectangle texture, we'd prefer to not cause a 1x1 w,h as it would interfere with flex layout fit-to-contents.
            return 0;
        }

        return (this._h || (this._source ? this._source.getRenderHeight() - this._y : 0)) / this._pixelRatio;
    }

    static getLookupIdFromSettings(obj: object): string {
        if (Array.isArray(obj)) {
            return obj.map((o) => this.getLookupIdFromSettings(o)).join(",");
        } else if (Utils.isObjectLiteral(obj)) {
            const parts = [];
            for (const [key, value] of Object.entries(obj)) {
                parts.push(key + "=" + this.getLookupIdFromSettings(value));
            }
            return parts.join("|");
        } else if (obj === undefined) {
            return "";
        } else {
            return "" + obj;
        }
    }
}

export type ResizeMode = {
    type: "cover" | "contain";
    w: number;
    h: number;
    x: number;
    y: number;
};

export type TextureSourceLoader = (
    cb: TextureSourceCallback,
    textureSource: TextureSource,
) => TextureSourceCancelFunction | void;
export type TextureSourceCallback = (error: Error | undefined, options?: TextureSourceOptions) => void;
export type TextureSourceCancelFunction = () => void;
export type TextureDrawableSource = Uint8Array | Uint8ClampedArray | WebGLTexture | TexImageSource;
export type TextureSourceOptions = {
    source: TextureDrawableSource;
    width?: number;
    height?: number;
    permanent?: boolean;
    hasAlpha?: boolean;
    premultiplyAlpha?: boolean;
    renderInfo?: any;
    texParams?: Record<GLenum, GLenum>;
    texOptions?: {
        format?: number;
        internalFormat?: number;
        type?: GLenum;
    };
};

import TextureSource from "./TextureSource";
import { WebGLNativeTexture } from "../renderer/webgl/WebGLNativeTexture";
import Utils from "./Utils";
