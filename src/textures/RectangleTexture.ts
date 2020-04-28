import { Texture, TextureSourceLoader } from "../tree/Texture";
import { Element, Stage } from "../tree";

export class RectangleTexture extends Texture {
    constructor(protected stage: Stage) {
        super(stage);

        // For performance reasons, we skip all element and active count registration for this specific texture type.
        // This means that clipping will also not work, but that doesn't matter for rectangles anyway.
        this.becomesUsed();
    }

    protected _getLookupId() {
        return "__whitepix";
    }

    protected _getSourceLoader(): TextureSourceLoader {
        return (cb) => {
            const whitePixel = new Uint8Array([255, 255, 255, 255]);
            cb(undefined, { source: whitePixel, width: 1, height: 1, permanent: true });
        };
    }

    addElement(v: Element) {
        // Ignore.
    }

    removeElement(v: Element) {
        // Ignore.
    }

    incActiveCount() {
        // Ignore.
    }

    decActiveCount() {
        // Ignore.
    }

    isAutosizeTexture() {
        return false;
    }
}
