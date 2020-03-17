import { WebGLNativeTexture } from "./WebGLNativeTexture";
import RenderTexture from "../RenderTexture";

export default interface WebGLRenderTexture extends RenderTexture, WebGLNativeTexture {
    framebuffer: WebGLFramebuffer;
}
