export default interface StageOptions {
    clearColor: number | null;
    gpuPixelsMemory: number;
    bufferMemory: number;
    defaultFontFace: string[];
    fixedTimestep: number;
    useImageWorker: boolean;
    autostart: boolean;
    pixelRatio: number;
    canvas2d: boolean;
}