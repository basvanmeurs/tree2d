import ImageWorker from "./imageWorker/ImageWorker";
import Stage from "../../tree/Stage";
import { TextureDrawableSource, TextureSourceOptions } from "../../tree/Texture";
import TextureSource from "../../tree/TextureSource";

/**
 * Platform-specific functionality.
 * Copyright Metrological, 2017
 * Copyright Bas van Meurs, 2020
 */
export default class WebPlatform {
    private _looping: boolean = false;
    private _awaitingLoop: boolean = false;
    private _imageWorker?: ImageWorker;

    constructor(private stage: Stage) {}

    init() {
        if (this.stage.useImageWorker) {
            if (!window.createImageBitmap || !window.Worker) {
                console.warn(
                    "Can't use image worker because browser does not have createImageBitmap and Web Worker support",
                );
            } else {
                // Firefox does support createImageBitmap, but not with the required paramater signature.
                const canvas = this.stage.getDrawingCanvas();
                canvas.width = 1;
                canvas.height = 1;
                (window.createImageBitmap as any)(canvas, {
                    premultiplyAlpha: "premultiply",
                    colorSpaceConversion: "none",
                    imageOrientation: "none",
                })
                    .then(() => {
                        console.log("Using image worker!");
                        this._imageWorker = new ImageWorker();
                    })
                    .catch(() => {
                        console.warn(
                            "Can't use image worker: createImageBitmap does not support signature. Using on-thread image parsing.",
                        );
                    });
            }
        }
    }

    destroy() {
        if (this._imageWorker) {
            this._imageWorker.destroy();
        }
    }

    startLoop() {
        this._looping = true;
        if (!this._awaitingLoop) {
            this.loop();
        }
    }

    stopLoop() {
        this._looping = false;
    }

    loop() {
        const lp = () => {
            this._awaitingLoop = false;
            if (this._looping) {
                this.stage.drawFrame();
                requestAnimationFrame(lp);
                this._awaitingLoop = true;
            }
        };
        requestAnimationFrame(lp);
    }

    uploadGlTexture(
        gl: WebGLRenderingContext,
        textureSource: TextureSource,
        source: TextureDrawableSource,
        options: any,
    ) {
        if ((source as any).buffer) {
            // Uint8Array
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                options.internalFormat,
                textureSource.w,
                textureSource.h,
                0,
                options.format,
                options.type,
                source as any,
            );
        } else {
            // Web-specific data types.
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                options.internalFormat,
                options.format,
                options.type,
                source as TexImageSource,
            );
        }
    }

    loadSrcTexture(info: { src: string; hasAlpha: boolean }, cb: (err: Error | undefined, result?: any) => void) {
        const { src, hasAlpha } = info;
        let cancelCb;
        const isPng = src.indexOf(".png") >= 0;
        if (this._imageWorker) {
            // WPE-specific image parser.
            const image = this._imageWorker.create(src);
            image.onError = (err: Error) => {
                return cb(err);
            };
            image.onLoad = (imageInfo: { imageBitmap: ImageBitmap; hasAlphaChannel: boolean }) => {
                cb(undefined, {
                    source: imageInfo.imageBitmap,
                    renderInfo: { src },
                    hasAlpha: imageInfo.hasAlphaChannel,
                    premultiplyAlpha: true,
                });
            };
            cancelCb = () => {
                image.cancel();
            };
        } else {
            const image = new Image();
            if (!(src.substr(0, 5) === "data:")) {
                // Base64.
                image.crossOrigin = "Anonymous";
            }
            image.onerror = (err: string | Event) => {
                // Ignore error message when cancelled.
                if (image.src) {
                    return cb(new Error("Image loading error: " + err));
                }
            };
            image.onload = () => {
                cb(undefined, {
                    source: image,
                    renderInfo: { src },
                    hasAlpha: isPng || hasAlpha,
                });
            };
            image.src = src;

            cancelCb = () => {
                image.onerror = null;
                image.onload = null;
                image.removeAttribute("src");
            };
        }

        return cancelCb;
    }

    createWebGLContext(): WebGLRenderingContext {
        const canvas = this.stage.canvas;

        const opts = {
            alpha: true,
            antialias: false,
            premultipliedAlpha: true,
            stencil: true,
            preserveDrawingBuffer: false,
        };

        const gl = (canvas.getContext("webgl", opts) ||
            canvas.getContext("experimental-webgl", opts)) as WebGLRenderingContext;
        if (!gl) {
            throw new Error("This browser does not support webGL.");
        }

        return gl;
    }

    createCanvasContext() {
        const canvas = this.stage.canvas;

        const c2d = canvas.getContext("2d");
        if (!c2d) {
            throw new Error("This browser does not support 2d canvas.");
        }

        return c2d;
    }

    getHrTime() {
        return window.performance ? window.performance.now() : new Date().getTime();
    }

    getDrawingCanvas() {
        // We can't reuse this canvas because textures may load async.
        return document.createElement("canvas");
    }

    getTextureOptionsForDrawingCanvas(canvas: HTMLCanvasElement) {
        const options: TextureSourceOptions = {
            source: canvas,
        };
        return options;
    }

    nextFrame(changes: boolean) {
        /* WebGL blits automatically */
    }
}
