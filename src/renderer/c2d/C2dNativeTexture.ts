import NativeTexture from '../NativeTexture';
import C2dTintCache from './C2dTintCache';

export type C2dNativeTexture = CanvasImageSource &
    NativeTexture & {
        tintCache?: C2dTintCache;
    };
