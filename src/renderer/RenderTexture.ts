import NativeTexture from "./NativeTexture";

export interface RenderTexture extends NativeTexture {
    id: number;
    f: number;
    ow: number;
    oh: number;
    precision: number;
    framebuffer: WebGLFramebuffer;
    projection: Float32Array;
}
