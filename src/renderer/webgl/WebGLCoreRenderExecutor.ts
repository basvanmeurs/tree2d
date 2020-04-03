import CoreRenderExecutor from "../../tree/core/CoreRenderExecutor";
import CoreContext from "../../tree/core/CoreContext";
import CoreQuadOperation from "../../tree/core/CoreQuadOperation";
import WebGLCoreQuadOperation from "./WebGLCoreQuadOperation";
import WebGLShader from "./WebGLShader";
import WebGLCoreQuadList from "./WebGLCoreQuadList";
import RenderTexture from "../RenderTexture";
import WebGLRenderTexture from "./WebGLRenderTexture";
import WebGLCoreRenderState from "./WebGLCoreRenderState";

export default class WebGLCoreRenderExecutor extends CoreRenderExecutor<WebGLCoreRenderState> {
    public readonly attribsBuffer: WebGLBuffer;
    public readonly quadsBuffer: WebGLBuffer;

    // The matrix that maps the [0,0 - W,H] coordinates to [-1,-1 - 1,1] in the vertex shaders.
    public projection: Float32Array;

    public scissor: number[] | undefined;
    public currentShaderProgram?: WebGLShader = undefined;
    public readonly gl: WebGLRenderingContext;

    constructor(context: CoreContext) {
        super(context);

        this.gl = this.context.stage.gl;

        this.attribsBuffer = this.gl.createBuffer()!;

        this.quadsBuffer = this.gl.createBuffer()!;

        this.projection = this.getProjectionVector();

        this.init();
    }

    updateProjectionVector() {
        this.projection = this.getProjectionVector();
    }

    private getProjectionVector() {
        return new Float32Array([2 / this.context.stage.coordsWidth, -2 / this.context.stage.coordsHeight]);
    }

    init() {
        const gl = this.gl;

        const maxQuads = Math.floor(this.renderState.quadList.data.byteLength / 80);

        // Init webgl arrays.
        const allIndices = new Uint16Array(maxQuads * 6);

        // fill the indices with the quads to draw.
        for (let i = 0, j = 0; i < maxQuads; i += 6, j += 4) {
            allIndices[i] = j;
            allIndices[i + 1] = j + 1;
            allIndices[i + 2] = j + 2;
            allIndices[i + 3] = j;
            allIndices[i + 4] = j + 2;
            allIndices[i + 5] = j + 3;
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadsBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, allIndices, gl.STATIC_DRAW);
    }

    destroy() {
        super.destroy();
        this.gl.deleteBuffer(this.attribsBuffer);
        this.gl.deleteBuffer(this.quadsBuffer);
    }

    protected _reset() {
        super._reset();

        const gl = this.gl;
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);

        this._stopShaderProgram();
        this._setupBuffers();
    }

    protected _setupBuffers() {
        const gl = this.gl;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadsBuffer);
        const element = new DataView(this.renderState.quadList.data, 0, this.renderState.quadList.getDataLength());
        gl.bindBuffer(gl.ARRAY_BUFFER, this.attribsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, element, gl.DYNAMIC_DRAW);
    }

    protected _setupQuadOperation(quadOperation: WebGLCoreQuadOperation) {
        super._setupQuadOperation(quadOperation);
        this._useShaderProgram(quadOperation.getWebGLShader(), quadOperation);
    }

    protected _renderQuadOperation(op: WebGLCoreQuadOperation) {
        const shader = op.getWebGLShader();

        if (op.length || op.shader.addEmpty()) {
            shader.beforeDraw(op);
            shader.draw(op);
            shader.afterDraw(op);
        }
    }

    protected _useShaderProgram(shader: WebGLShader, operation: WebGLCoreQuadOperation) {
        if (!shader.hasSameProgram(this.currentShaderProgram!)) {
            if (this.currentShaderProgram) {
                this.currentShaderProgram.stopProgram();
            }
            shader.useProgram();
            this.currentShaderProgram = shader;
        }
        shader.setupUniforms(operation);
    }

    protected _stopShaderProgram() {
        if (this.currentShaderProgram) {
            // The currently used shader program should be stopped gracefully.
            this.currentShaderProgram.stopProgram();
            this.currentShaderProgram = undefined;
        }
    }

    public _bindRenderTexture(renderTexture: RenderTexture) {
        super._bindRenderTexture(renderTexture);

        const gl = this.gl;
        if (!renderTexture) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.context.stage.w, this.context.stage.h);
        } else {
            const rt = renderTexture as WebGLRenderTexture;
            gl.bindFramebuffer(gl.FRAMEBUFFER, rt.framebuffer);
            gl.viewport(0, 0, rt.w, rt.h);
        }
    }

    protected _clearRenderTexture() {
        super._clearRenderTexture();
        const gl = this.gl;
        if (!this._renderTexture) {
            const glClearColor = this.context.stage.getClearColor();
            if (glClearColor) {
                gl.clearColor(
                    glClearColor[0] * glClearColor[3],
                    glClearColor[1] * glClearColor[3],
                    glClearColor[2] * glClearColor[3],
                    glClearColor[3],
                );
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        } else {
            // Clear texture.
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    protected _setScissor(area: number[] | undefined) {
        super._setScissor(area);

        if (this.scissor === area) {
            return;
        }
        this.scissor = area;

        const gl = this.gl;
        if (!area) {
            gl.disable(gl.SCISSOR_TEST);
        } else {
            gl.enable(gl.SCISSOR_TEST);
            const pixelRatio = this.context.stage.getPixelRatio();
            let y = area[1];
            if (this._renderTexture === undefined) {
                // Flip, for the main framebuffer the coordinates are inversed.
                y = this.context.stage.coordsHeight - (area[1] + area[3]);
            }
            gl.scissor(
                Math.round(area[0] * pixelRatio),
                Math.round(y * pixelRatio),
                Math.round(area[2] * pixelRatio),
                Math.round(area[3] * pixelRatio),
            );
        }
    }
}
