import NativeTexture from '../NativeTexture';

export type WebGLNativeTexture = WebGLTexture &
    NativeTexture & {
        params: any;
        options: any;
    };
