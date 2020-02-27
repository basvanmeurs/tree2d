import CoreRenderExecutor from "../../tree/core/CoreRenderExecutor";
import CoreContext from "../../tree/core/CoreContext";
import CoreQuadOperation from "../../tree/core/CoreQuadOperation";
import WebGLCoreQuadOperation from "./WebGLCoreQuadOperation";
import WebGLShader from "./WebGLShader";
import { RenderTexture } from "./WebGLRenderer";

export default class WebGLCoreRenderExecutor extends CoreRenderExecutor<WebGLRenderingContext> {
    private _attribsBuffer: WebGLBuffer;
    private _quadsBuffer: WebGLBuffer;
    private _projection: Float32Array;
    _scissor: number[];
    private _currentShaderProgram?: WebGLShader;

    constructor(ctx: CoreContext) {
        super(ctx);

        this.gl = this.ctx.stage.gl;

        this.init();
    }

    init() {
        const gl = this.gl;

        // Create new sharable buffer for params.
        this._attribsBuffer = gl.createBuffer()!;

        const maxQuads = Math.floor(this.renderState.quads.data.byteLength / 80);

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

        // The quads buffer can be (re)used to draw a range of quads.
        this._quadsBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._quadsBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, allIndices, gl.STATIC_DRAW);

        // The matrix that causes the [0,0 - W,H] box to map to [-1,-1 - 1,1] in the end results.
        this._projection = new Float32Array([2 / this.ctx.stage.coordsWidth, -2 / this.ctx.stage.coordsHeight]);
    }

    destroy() {
        super.destroy();
        this.gl.deleteBuffer(this._attribsBuffer);
        this.gl.deleteBuffer(this._quadsBuffer);
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
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._quadsBuffer);
        const element = new Float32Array(this.renderState.quads.data, 0, this.renderState.quads.dataLength);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._attribsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, element, gl.DYNAMIC_DRAW);
    }

    protected _setupQuadOperation(quadOperation: WebGLCoreQuadOperation) {
        super._setupQuadOperation(quadOperation);
        this._useShaderProgram(quadOperation.shader, quadOperation);
    }

    protected _renderQuadOperation(op: WebGLCoreQuadOperation) {
        const shader = op.shader;

        if (op.length || op.shader.addEmpty()) {
            shader.beforeDraw(op);
            shader.draw(op);
            shader.afterDraw(op);
        }
    }

    /**
     * @param {WebGLShader} shader;
     * @param {CoreQuadOperation} operation;
     */
    protected _useShaderProgram(shader: WebGLShader, operation: WebGLCoreQuadOperation) {
        if (!shader.hasSameProgram(this._currentShaderProgram!)) {
            if (this._currentShaderProgram) {
                this._currentShaderProgram.stopProgram();
            }
            shader.useProgram();
            this._currentShaderProgram = shader;
        }
        shader.setupUniforms(operation);
    }

    protected _stopShaderProgram() {
        if (this._currentShaderProgram) {
            // The currently used shader program should be stopped gracefully.
            this._currentShaderProgram.stopProgram();
            this._currentShaderProgram = undefined;
        }
    }

    public _bindRenderTexture(renderTexture: RenderTexture) {
        super._bindRenderTexture(renderTexture);

        const gl = this.gl;
        if (!this._renderTexture) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.ctx.stage.w, this.ctx.stage.h);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this._renderTexture.framebuffer);
            gl.viewport(0, 0, this._renderTexture.w, this._renderTexture.h);
        }
    }

    protected _clearRenderTexture() {
        super._clearRenderTexture();
        const gl = this.gl;
        if (!this._renderTexture) {
            const glClearColor = this.ctx.stage.getClearColor();
            if (glClearColor) {
                gl.clearColor(
                    glClearColor[0] * glClearColor[3],
                    glClearColor[1] * glClearColor[3],
                    glClearColor[2] * glClearColor[3],
                    glClearColor[3]
                );
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
        } else {
            // Clear texture.
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    protected _setScissor(area: number[]) {
        super._setScissor(area);

        if (this._scissor === area) {
            return;
        }
        this._scissor = area;

        const gl = this.gl;
        if (!area) {
            gl.disable(gl.SCISSOR_TEST);
        } else {
            gl.enable(gl.SCISSOR_TEST);
            const precision = this.ctx.stage.getRenderPrecision();
            let y = area[1];
            if (this._renderTexture === null) {
                // Flip.
                y = this.ctx.stage.h / precision - (area[1] + area[3]);
            }
            gl.scissor(
                Math.round(area[0] * precision),
                Math.round(y * precision),
                Math.round(area[2] * precision),
                Math.round(area[3] * precision)
            );
        }
    }
}
