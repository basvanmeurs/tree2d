import Texture, {TextureSourceLoader} from "../tree/Texture";

export default class NoiseTexture extends Texture {

    protected _getLookupId() {
        return "__noise";
    }

    protected _getSourceLoader(): TextureSourceLoader {
        const gl = this.stage.gl;
        return function(cb) {
            const noise = new Uint8Array(128 * 128 * 4);
            for (let i = 0; i < 128 * 128 * 4; i += 4) {
                const v = Math.floor(Math.random() * 256);
                noise[i] = v;
                noise[i + 1] = v;
                noise[i + 2] = v;
                noise[i + 3] = 255;
            }
            const texParams: Record<GLenum, GLenum> = {};

            if (gl) {
                texParams[gl.TEXTURE_WRAP_S] = gl.REPEAT;
                texParams[gl.TEXTURE_WRAP_T] = gl.REPEAT;
                texParams[gl.TEXTURE_MIN_FILTER] = gl.NEAREST;
                texParams[gl.TEXTURE_MAG_FILTER] = gl.NEAREST;
            }

            const canvas = document.createElement('canvas');
            canvas.width  = 128;
            canvas.height = 128;
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle="red";
            ctx.fillRect(0,0,50,200);
            cb(undefined, {source: canvas, width: 100, height: 100})
            //
            // cb(undefined, { source: canvas, width: 100, height: 100 });
            //cb(undefined, { source: noise, width: 128, height: 128, texParams: texParams });
        };
    }

}
