import { RenderTexture } from "../RenderTexture";
import { WebGLNativeTexture } from "./WebGLNativeTexture";

export interface WebGLRenderTexture extends RenderTexture, WebGLNativeTexture {
    framebuffer: WebGLFramebuffer;
}
