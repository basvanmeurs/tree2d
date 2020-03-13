import ImageWorker from "./ImageWorker";

/**
 * Platform-specific functionality.
 * Copyright Metrological, 2017;
 */
export default class WebPlatform {
    init(stage) {
        this.stage = stage;
        this._looping = false;
        this._awaitingLoop = false;

        if (this.stage.getOption("useImageWorker")) {
            if (!window.createImageBitmap || !window.Worker) {
                console.warn(
                    "Can't use image worker because browser does not have createImageBitmap and Web Worker support"
                );
            } else {
                console.log("Using image worker!");
                this._imageWorker = new ImageWorker();
            }
        }
    }

    destroy() {
        if (this._imageWorker) {
            this._imageWorker.destroy();
        }
        this._removeKeyHandler();
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

    uploadGlTexture(gl, textureSource, source, options) {
        if (
            source instanceof ImageData ||
            source instanceof HTMLImageElement ||
            source instanceof HTMLCanvasElement ||
            source instanceof HTMLVideoElement ||
            (window.ImageBitmap && source instanceof ImageBitmap)
        ) {
            // Web-specific data types.
            gl.texImage2D(gl.TEXTURE_2D, 0, options.internalFormat, options.format, options.type, source);
        } else {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                options.internalFormat,
                textureSource.w,
                textureSource.h,
                0,
                options.format,
                options.type,
                source
            );
        }
    }

    loadSrcTexture({ src, hasAlpha }, cb) {
        let cancelCb = undefined;
        const isPng = src.indexOf(".png") >= 0;
        if (this._imageWorker) {
            // WPE-specific image parser.
            const image = this._imageWorker.create(src);
            image.onError = function(err) {
                return cb(new Error("Image load error: " + err.toString()));
            };
            image.onLoad = function({ imageBitmap, hasAlphaChannel }) {
                cb(null, {
                    source: imageBitmap,
                    renderInfo: { src: src },
                    hasAlpha: hasAlphaChannel,
                    premultiplyAlpha: true
                });
            };
            cancelCb = function() {
                image.cancel();
            };
        } else {
            const image = new Image();
            if (!(src.substr(0, 5) == "data:")) {
                // Base64.
                image.crossOrigin = "Anonymous";
            }
            image.onerror = function(err) {
                // Ignore error message when cancelled.
                if (image.src) {
                    return cb("Image load error");
                }
            };
            image.onload = function() {
                cb(null, {
                    source: image,
                    renderInfo: { src: src },
                    hasAlpha: isPng || hasAlpha
                });
            };
            image.src = src;

            cancelCb = function() {
                image.onerror = null;
                image.onload = null;
                image.removeAttribute("src");
            };
        }

        return cancelCb;
    }

    createWebGLContext(w, h) {
        const canvas = this.stage.getOption("canvas") || document.createElement("canvas");

        if (w && h) {
            canvas.width = w;
            canvas.height = h;
        }

        const opts = {
            alpha: true,
            antialias: false,
            premultipliedAlpha: true,
            stencil: true,
            preserveDrawingBuffer: false
        };

        const gl = canvas.getContext("webgl", opts) || canvas.getContext("experimental-webgl", opts);
        if (!gl) {
            throw new Error("This browser does not support webGL.");
        }

        return gl;
    }

    createCanvasContext(w, h) {
        const canvas = this.stage.getOption("canvas") || document.createElement("canvas");

        if (w && h) {
            canvas.width = w;
            canvas.height = h;
        }

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

    getTextureOptionsForDrawingCanvas(canvas) {
        const options = {};
        options.source = canvas;
        return options;
    }

    nextFrame(changes) {
        /* WebGL blits automatically */
    }

    registerKeydownHandler(keyhandler) {
        this._keydownListener = e => {
            keyhandler(e);
        };
        window.addEventListener("keydown", this._keydownListener);
    }

    registerKeyupHandler(keyhandler) {
        this._keyupListener = e => {
            keyhandler(e);
        };
        window.addEventListener("keyup", this._keyupListener);
    }

    _removeKeyHandler() {
        if (this._keydownListener) {
            window.removeEventListener("keydown", this._keydownListener);
        }

        if (this._keyupListener) {
            window.removeEventListener("keyup", this._keyupListener);
        }
    }
}
