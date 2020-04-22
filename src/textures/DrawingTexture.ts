import { Texture, TextureSourceLoader, TextureSourceOptions } from "../tree/Texture";

export type DrawingResult = {
    permanent?: boolean;
    renderInfo?: any;
    texParams?: Record<GLenum, GLenum>;
    texOptions?: {
        format?: number;
        internalFormat?: number;
        type?: GLenum;
    };
};

export type DrawingFunctionOptions = {
    context: CanvasRenderingContext2D;
    w: number;
    h: number;
};

export type DrawingFunction = (options: DrawingFunctionOptions) => DrawingResult | Promise<DrawingResult>;

export class DrawingTexture extends Texture {
    private _drawingFunction?: DrawingFunction = undefined;
    private _canvasWidth: number = 0;
    private _canvasHeight: number = 0;

    set drawingFunction(f: DrawingFunction | undefined) {
        this._drawingFunction = f;
        this._changed();
    }

    get drawingFunction(): DrawingFunction | undefined {
        return this._drawingFunction;
    }

    set canvasWidth(v: number) {
        if (this._canvasWidth !== v) {
            this._canvasWidth = v;
            this._changed();
        }
    }

    set canvasHeight(v: number) {
        if (this._canvasHeight !== v) {
            this._canvasHeight = v;
            this._changed();
        }
    }

    protected _getIsValid() {
        return !!this._drawingFunction && this._canvasWidth > 0 && this._canvasHeight > 0;
    }

    protected _getSourceLoader(): TextureSourceLoader {
        return (cb) => {
            const canvas = this.stage.platform.getDrawingCanvas();
            canvas.width = this._canvasWidth;
            canvas.height = this._canvasHeight;
            const context = canvas.getContext("2d")!;
            context.imageSmoothingEnabled = true;

            let result;
            try {
                result = this._drawingFunction!({ context, w: this._canvasWidth, h: this._canvasHeight });
            } catch (e) {
                if (e instanceof Error) {
                    cb(e);
                } else {
                    cb(new Error("Error while drawing: " + e));
                }
                return;
            }

            const handleResult = (result: DrawingResult) => {
                const textureSourceOptions = result as TextureSourceOptions;
                textureSourceOptions.source = canvas;
                cb(undefined, textureSourceOptions);
            };

            if (result instanceof Promise) {
                result.then((r) => handleResult(r)).catch((e) => cb(e));
            } else {
                handleResult(result);
            }
        };
    }
}
