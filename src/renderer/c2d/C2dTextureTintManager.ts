import Stage from '../../tree/Stage';
import C2dTintCache from './C2dTintCache';
import { C2dNativeTexture } from './C2dNativeTexture';
import C2dRenderTexture from './C2dRenderTexture';

export default class C2dTextureTintManager {
    private _usedMemory: number = 0;
    private _cachedNativeTextures = new Set<C2dNativeTexture>();

    constructor(private stage: Stage) {}

    destroy() {
        this.gc(true);
    }

    private _addMemoryUsage(delta: number) {
        this._usedMemory += delta;

        this.stage.addMemoryUsage(delta);
    }

    delete(nativeTexture: C2dNativeTexture) {
        // Should be called when native texture is cleaned up.
        if (this._hasCache(nativeTexture)) {
            const cache = this._getCache(nativeTexture);
            const prevMemUsage = cache.memoryUsage;
            cache.clear();
            this._cachedNativeTextures.delete(nativeTexture);
            this._addMemoryUsage(cache.memoryUsage - prevMemUsage);
        }
    }

    getTintTexture(nativeTexture: C2dNativeTexture, color: number) {
        const frame = this.stage.frameCounter;

        this._cachedNativeTextures.add(nativeTexture);

        const cache = this._getCache(nativeTexture);

        const item = cache.get(color);
        item.lf = frame;

        if (item.tx) {
            if (nativeTexture.updateFrame > item.u) {
                // Native texture was updated in the mean time: renew.
                this._tintTexture(item.tx, nativeTexture, color);
            }

            return item.tx;
        } else {
            const before = cache.memoryUsage;

            // Find blanco tint texture.
            let target = cache.reuseTexture(frame);
            if (target) {
                target.context.clearRect(0, 0, target.w, target.h);
            } else {
                // Allocate new.
                target = document.createElement('canvas') as C2dRenderTexture;
                target.w = nativeTexture.w;
                target.h = nativeTexture.h;
                target.context = target.getContext('2d')!;
            }

            this._tintTexture(target, nativeTexture, color);
            cache.set(color, target, frame);

            const after = cache.memoryUsage;

            if (after !== before) {
                this._addMemoryUsage(after - before);
            }

            return target;
        }
    }

    _tintTexture(target: C2dRenderTexture, source: C2dNativeTexture, color: number) {
        let col = color.toString(16);
        while (col.length < 6) {
            col = '0' + col;
        }
        target.context.fillStyle = '#' + col;
        target.context.globalCompositeOperation = 'copy';
        target.context.fillRect(0, 0, source.w, source.h);
        target.context.globalCompositeOperation = 'multiply';
        target.context.drawImage(source, 0, 0, source.w, source.h, 0, 0, target.w, target.h);

        // Alpha-mix the texture.
        target.context.globalCompositeOperation = 'destination-in';
        target.context.drawImage(source, 0, 0, source.w, source.h, 0, 0, target.w, target.h);
    }

    private _hasCache(nativeTexture: C2dNativeTexture) {
        return !!nativeTexture.tintCache;
    }

    private _getCache(nativeTexture: C2dNativeTexture): C2dTintCache {
        if (!nativeTexture.tintCache) {
            nativeTexture.tintCache = new C2dTintCache(nativeTexture);
        }
        return nativeTexture.tintCache;
    }

    gc(aggressive: boolean = false) {
        const frame = this.stage.frameCounter;
        let delta = 0;
        this._cachedNativeTextures.forEach(texture => {
            const cache = this._getCache(texture);
            const before = cache.memoryUsage;
            cache.cleanup(frame);
            cache.releaseBlancoTextures();
            delta += cache.memoryUsage - before;
        });

        if (aggressive) {
            this._cachedNativeTextures.clear();
        }

        if (delta) {
            this._addMemoryUsage(delta);
        }
    }
}
