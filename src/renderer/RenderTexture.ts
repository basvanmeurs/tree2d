import { NativeTexture } from "./NativeTexture";

export interface RenderTexture extends NativeTexture {
    _id: number;
    f: number;
    ow: number;
    oh: number;
    pixelRatio: number;
}
