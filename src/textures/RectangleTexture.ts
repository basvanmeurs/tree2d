import Texture, { TextureSourceLoader } from "../tree/Texture";

export default class RectangleTexture extends Texture {
    protected _getLookupId() {
        return "__whitepix";
    }

    protected _getSourceLoader(): TextureSourceLoader {
        return (cb) => {
            const whitePixel = new Uint8Array([255, 255, 255, 255]);
            cb(undefined, { source: whitePixel, width: 1, height: 1, permanent: true });
        };
    }

    isAutosizeTexture() {
        return false;
    }
}
