import NativeTexture from "./NativeTexture";

export default interface RenderTexture extends NativeTexture {
    _id: number;
    f: number;
    ow: number;
    oh: number;
    precision: number;
}
