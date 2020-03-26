import TextureSource from "../TextureSource";
import Element from "../Element";
import ElementCore from "./ElementCore";
import CoreContext from "./CoreContext";
import RenderTexture from "../../renderer/RenderTexture";
import NativeTexture from "../../renderer/NativeTexture";

export default class ElementTexturizer {
    private _element: Element = this._core.element;
    private context: CoreContext = this._core.context;
    private _enabled: boolean = false;

    // In lazy mode, render to texture will be disabled when there are changes since the last frame.
    public lazy: boolean = false;

    private _colorize: boolean = false;
    private _renderTexture?: RenderTexture;
    private _reusedTexture?: NativeTexture;
    private _resultTextureSource?: TextureSource;
    private _renderOffscreen: boolean = false;
    public empty: boolean = false;

    constructor(private _core: ElementCore) {}

    get enabled() {
        return this._enabled;
    }

    set enabled(v: boolean) {
        this._enabled = v;
        this._core.updateRenderToTextureEnabled();
    }

    get renderOffscreen() {
        return this._renderOffscreen;
    }

    set renderOffscreen(v: boolean) {
        this._renderOffscreen = v;
        this._core.setHasRenderUpdates(1);

        // This enforces rechecking the 'within bounds'.
        this._core._setRecalc(6);
    }

    get colorize() {
        return this._colorize;
    }

    set colorize(v: boolean) {
        if (this._colorize !== v) {
            this._colorize = v;

            // Only affects the finally drawn quad.
            this._core.setHasRenderUpdates(1);
        }
    }

    _getTextureSource() {
        if (!this._resultTextureSource) {
            this._resultTextureSource = new TextureSource(this._element.stage.textureManager);
            this.updateResultTexture();
        }
        return this._resultTextureSource;
    }

    hasResultTexture() {
        return !!this._resultTextureSource;
    }

    resultTextureInUse() {
        return this._resultTextureSource && this._resultTextureSource.hasEnabledElements();
    }

    updateResultTexture() {
        const resultTexture = this.getResultTexture();
        if (this._resultTextureSource) {
            if (this._resultTextureSource.nativeTexture !== resultTexture) {
                const w = resultTexture ? resultTexture.w : 0;
                const h = resultTexture ? resultTexture.h : 0;
                this._resultTextureSource.replaceNativeTexture(resultTexture, w, h);
            }

            // Texture will be updated: all elements using the source need to be updated as well.
            this._resultTextureSource.forEachEnabledElement((element) => {
                element._updateTextureDimensions();
                element.core.setHasRenderUpdates(3);
            });
        }
    }

    mustRenderToTexture() {
        // Check if we must really render as texture.
        if (this._enabled && !this.lazy) {
            return true;
        } else if (this._enabled && this.lazy && !this._core.hasRenderTextureUpdates()) {
            // Static-only: if renderToTexture did not need to update during last drawn frame, generate it as a cache.
            return true;
        }
        return false;
    }

    deactivate() {
        this.release();
    }

    get renderTextureReused() {
        return !!this._reusedTexture;
    }

    release() {
        this.releaseRenderTexture();
    }

    releaseRenderTexture() {
        if (this._renderTexture) {
            this.context.releaseRenderTexture(this._renderTexture);
            this._renderTexture = undefined;
            this.updateResultTexture();
        }
    }

    // Reuses the specified texture as the render texture (in ancestor).
    reuseTextureAsRenderTexture(nativeTexture: NativeTexture) {
        if (this._renderTexture !== nativeTexture) {
            this.releaseRenderTexture();
            this._reusedTexture = nativeTexture;
        }
    }

    hasRenderTexture() {
        return !!this._renderTexture;
    }

    getRenderTexture() {
        if (!this._renderTexture) {
            this._renderTexture = this.context.allocateRenderTexture(this._core.getLayoutW(), this._core.getLayoutH());
            this._reusedTexture = undefined;
        }
        return this._renderTexture;
    }

    getResultTexture(): NativeTexture | undefined {
        return this._reusedTexture || this._renderTexture;
    }
}
