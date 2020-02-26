/**
 * Base functionality for shader setup/destroy.
 */
export default class WebGLShaderProgram {
    _program: WebGLProgram | null;
    _uniformLocations: Map<string, WebGLUniformLocation>;
    _attributeLocations: Map<string, GLint>;
    _currentUniformValues: { [key: string]: any };
    gl: WebGLRenderingContext;

    constructor(public vertexShaderSource: string, public fragmentShaderSource: string) {
        this._uniformLocations = new Map();
        this._attributeLocations = new Map();

        this._currentUniformValues = {};
    }

    compile(gl: WebGLRenderingContext) {
        if (this._program) return;

        this.gl = gl;

        this._program = gl.createProgram()!;

        const glVertShader = this._glCompile(gl.VERTEX_SHADER, this.vertexShaderSource);
        const glFragShader = this._glCompile(gl.FRAGMENT_SHADER, this.fragmentShaderSource);

        gl.attachShader(this._program, glVertShader!);
        gl.attachShader(this._program, glFragShader!);
        gl.linkProgram(this._program);

        // if linking fails, then log and cleanup
        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
            console.error("Error: Could not initialize shader.");
            console.error("gl.VALIDATE_STATUS", gl.getProgramParameter(this._program, gl.VALIDATE_STATUS));
            console.error("gl.getError()", gl.getError());

            // if there is a program info log, log it
            if (gl.getProgramInfoLog(this._program) !== "") {
                console.warn("Warning: gl.getProgramInfoLog()", gl.getProgramInfoLog(this._program));
            }

            gl.deleteProgram(this._program);
            this._program = null;
        }

        // clean up some shaders
        gl.deleteShader(glVertShader);
        gl.deleteShader(glFragShader);
    }

    _glCompile(type: GLenum, src: string) {
        const shader = this.gl.createShader(type);

        this.gl.shaderSource(shader!, src);
        this.gl.compileShader(shader!);

        if (!this.gl.getShaderParameter(shader!, this.gl.COMPILE_STATUS)) {
            console.log(
                this.constructor.name,
                "Type: " + (type === this.gl.VERTEX_SHADER ? "vertex shader" : "fragment shader")
            );
            console.log(this.gl.getShaderInfoLog(shader!));
            let idx = 0;
            console.log(
                "========== source ==========\n" +
                    src
                        .split("\n")
                        .map(line => "" + ++idx + ": " + line)
                        .join("\n")
            );
            return null;
        }

        return shader;
    }

    getUniformLocation(name: string) {
        let location = this._uniformLocations.get(name);
        if (location === undefined) {
            location = this.gl.getUniformLocation(this._program!, name)!;
            this._uniformLocations.set(name, location!);
        }

        return location;
    }

    getAttribLocation(name: string) {
        let location = this._attributeLocations.get(name);
        if (location === undefined) {
            location = this.gl.getAttribLocation(this._program!, name);
            this._attributeLocations.set(name, location!);
        }

        return location;
    }

    destroy() {
        if (this._program) {
            this.gl.deleteProgram(this._program);
            this._program = null;
        }
    }

    get glProgram() {
        return this._program;
    }

    get compiled() {
        return !!this._program;
    }

    private static _valueEquals<T extends any>(v1: T, v2: T) {
        // Uniform value is either a typed array or a numeric value.
        if (v1.length && v2.length) {
            for (let i = 0, n = v1.length; i < n; i++) {
                if (v1[i] !== v2[i]) return false;
            }
            return true;
        } else {
            return v1 === v2;
        }
    }

    private static _valueClone(v: any) {
        if (v.length) {
            return v.slice(0);
        } else {
            return v;
        }
    }

    setUniformValue(name: string, value: any, glFunction: Function) {
        const v = this._currentUniformValues[name];
        if (v === undefined || !WebGLShaderProgram._valueEquals(v, value)) {
            const clonedValue = WebGLShaderProgram._valueClone(value);
            this._currentUniformValues[name] = clonedValue;

            const loc = this.getUniformLocation(name);
            if (loc) {
                const isMatrix =
                    glFunction === this.gl.uniformMatrix2fv ||
                    glFunction === this.gl.uniformMatrix3fv ||
                    glFunction === this.gl.uniformMatrix4fv;
                if (isMatrix) {
                    glFunction.call(this.gl, loc, false, clonedValue);
                } else {
                    glFunction.call(this.gl, loc, clonedValue);
                }
            }
        }
    }
}
