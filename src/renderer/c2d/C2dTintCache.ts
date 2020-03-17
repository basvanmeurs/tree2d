import NativeTexture from "../NativeTexture";
import C2dRenderTexture from "./C2dRenderTexture";

type CacheEntry = {
    tx: C2dRenderTexture | undefined;
    lf: number;
    u: number;
};

export default class C2dTintCache {
    private _colors = new Map<number, CacheEntry>();
    private _blancoTextures: C2dRenderTexture[] = [];
    private _lastCleanupFrame: number = 0;
    private _memTextures: number = 0;

    constructor(public readonly nativeTexture: NativeTexture) {}

    get memoryUsage() {
        return this._memTextures * this.nativeTexture.width * this.nativeTexture.height;
    }

    releaseBlancoTextures() {
        this._memTextures -= this._blancoTextures.length;
        this._blancoTextures = [];
    }

    clear() {
        this._blancoTextures = [];
        this._colors.clear();
        this._memTextures = 0;
    }

    get(color: number) {
        let item: CacheEntry | undefined = this._colors.get(color);
        if (!item) {
            item = { lf: -1, tx: undefined, u: -1 };
            this._colors.set(color, item);
        }
        return item;
    }

    set(color: number, texture: C2dRenderTexture, frame: number) {
        const item = this.get(color);
        item.lf = frame;
        item.tx = texture;
        item.u = frame;
        this._memTextures++;
    }

    cleanup(frame: number) {
        // We only need to clean up once per frame.
        if (this._lastCleanupFrame !== frame) {
            // We limit blanco textures reuse to one frame only to prevent memory usage growth.
            this._blancoTextures = [];

            this._colors.forEach((item, color) => {
                // Clean up entries that were not used last frame.
                if (item.lf < frame - 1) {
                    if (item.tx) {
                        // Keep as reusable blanco texture.
                        this._blancoTextures.push(item.tx);
                    }
                    this._colors.delete(color);
                }
            });

            this._lastCleanupFrame = frame;
        }
    }

    reuseTexture(frame: number): C2dRenderTexture | undefined {
        // Try to reuse textures, because creating them every frame is expensive.
        this.cleanup(frame);
        if (this._blancoTextures && this._blancoTextures.length) {
            this._memTextures--;
            return this._blancoTextures.pop();
        }
    }
}
