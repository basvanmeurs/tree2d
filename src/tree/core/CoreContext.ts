import Stage from "../Stage";
import ElementCore from "./ElementCore";
import CoreRenderState from "./CoreRenderState";
import CoreRenderExecutor from "./CoreRenderExecutor";
import NativeTexture from "../../renderer/NativeTexture";
import { CopyRenderTextureOptions } from "../../renderer/Renderer";
import RenderTexture from "../../renderer/RenderTexture";

export default class CoreContext {
    public root?: ElementCore = undefined;
    public updateTreeOrder: number = 0;
    public readonly renderState: CoreRenderState = this.stage.renderer.createCoreRenderState(this);
    public readonly renderExecutor: CoreRenderExecutor = this.stage.renderer.createCoreRenderExecutor(this);
    private _usedMemory: number = 0;
    private _renderTexturePool: RenderTexture[] = [];
    private _renderTextureId: number = 1;
    private _zSorts: ElementCore[];

    constructor(public readonly stage: Stage) {
        this._zSorts = [];
    }

    get usedMemory() {
        return this._usedMemory;
    }

    destroy() {
        this._renderTexturePool.forEach((texture) => this._freeRenderTexture(texture));
        this._usedMemory = 0;
    }

    private getRootParent(): ElementCore {
        return this.root!.getParent()!;
    }

    hasRenderUpdates() {
        return this.getRootParent().hasRenderUpdates();
    }

    _clearRenderUpdatesFlag() {
        this.getRootParent().clearHasRenderUpdates();
    }

    setRenderUpdatesFlag() {
        this.getRootParent().setHasRenderUpdates(1);
    }

    render() {
        this._render();
    }

    update() {
        // We must clear flag before the update loop, because update events may trigger new render updates.
        this._clearRenderUpdatesFlag();

        this._update();

        // Due to the boundsVisibility flag feature (and onAfterUpdate hook), it is possible that other elements were
        // changed during the update loop (for example due to the txLoaded event). We process these changes immediately
        // (but not recursively to prevent infinite loops).
        if (this.root!.hasUpdates()) {
            this._update();
        }

        this._performForcedZSorts();
    }

    /**
     * Certain ElementCore items may be forced to zSort to strip out references to prevent memleaks..
     */
    private _performForcedZSorts() {
        const n = this._zSorts.length;
        if (n) {
            // Forced z-sorts (ElementCore may force a z-sort in order to free memory/prevent memory leaks).
            for (let i = 0; i < n; i++) {
                if (this._zSorts[i].zSort) {
                    this._zSorts[i].sortZIndexedChildren();
                }
            }
            this._zSorts = [];
        }
    }

    private _update() {
        this.updateTreeOrder = 0;
        this.root!.update();
    }

    private _render() {
        // Obtain a sequence of the quad operations.
        this._fillRenderState();

        // Now run them with the render executor.
        this._performRender();
    }

    private _fillRenderState() {
        this.renderState.reset();
        this.root!.render();
        this.renderState.finish();
    }

    private _performRender() {
        this.renderExecutor.execute();
    }

    private _addMemoryUsage(delta: number) {
        this._usedMemory += delta;
        this.stage.addMemoryUsage(delta);
    }

    allocateRenderTexture(w: number, h: number) {
        const prec = this.stage.getPixelRatio();
        const pw = Math.max(1, Math.round(w * prec));
        const ph = Math.max(1, Math.round(h * prec));

        // Search last item first, so that last released render texture is preferred (may cause memory cache benefits).
        const n = this._renderTexturePool.length;
        for (let i = n - 1; i >= 0; i--) {
            const texture = this._renderTexturePool[i];
            // We don't want to reuse the same render textures within the same frame because that will create gpu stalls.
            if (texture.w === pw && texture.h === ph && texture.updateFrame !== this.stage.frameCounter) {
                texture.f = this.stage.frameCounter;
                this._renderTexturePool.splice(i, 1);
                return texture;
            }
        }

        const renderTexture = this._createRenderTexture(w, h, pw, ph);
        renderTexture.pixelRatio = prec;
        return renderTexture;
    }

    releaseRenderTexture(texture: RenderTexture) {
        this._renderTexturePool.push(texture);
    }

    freeUnusedRenderTextures(maxAge = 60) {
        // Clean up all textures that are no longer used.
        // This cache is short-lived because it is really just meant to supply running shaders that are
        // updated during a number of frames.
        const limit = this.stage.frameCounter - maxAge;

        this._renderTexturePool = this._renderTexturePool.filter((texture) => {
            if (texture.f <= limit) {
                this._freeRenderTexture(texture);
                return false;
            }
            return true;
        });
    }

    protected _createRenderTexture(w: number, h: number, pw: number, ph: number) {
        this._addMemoryUsage(pw * ph);

        const texture = this.stage.renderer.createRenderTexture(w, h, pw, ph);
        texture._id = this._renderTextureId++;
        texture.f = this.stage.frameCounter;
        texture.ow = w;
        texture.oh = h;
        texture.w = pw;
        texture.h = ph;

        return texture;
    }

    _freeRenderTexture(renderTexture: RenderTexture) {
        this.stage.renderer.freeRenderTexture(renderTexture);
        this._addMemoryUsage(-renderTexture.w * renderTexture.h);
    }

    copyRenderTexture(renderTexture: RenderTexture, nativeTexture: NativeTexture, options: CopyRenderTextureOptions) {
        this.stage.renderer.copyRenderTexture(renderTexture, nativeTexture, options);
    }

    forceZSort(elementCore: ElementCore) {
        this._zSorts.push(elementCore);
    }
}
