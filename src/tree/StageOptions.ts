export interface StageOptions {
    clearColor: number | string | null;
    gpuPixelsMemory: number;
    bufferMemory: number;
    defaultFontFace: string[];
    fixedTimestep: number;
    useImageWorker: boolean;
    autostart: boolean;
    pixelRatio: number;
    canvas2d: boolean;
}
