export interface RenderTextureInfo {
    nativeTexture?: WebGLTexture;
    offset: number;
    w: number;
    h: number;
    empty: boolean;
    cleared: boolean;
    ignore: boolean;
    cache: boolean;
}
