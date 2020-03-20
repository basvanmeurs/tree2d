import DefaultShader from './DefaultShader';
import CoreContext from '../../../tree/core/CoreContext';
import WebGLCoreQuadOperation from '../WebGLCoreQuadOperation';

export default class InversionShader extends DefaultShader {
    private _amount: number = 1;

    constructor(context: CoreContext) {
        super(context);
    }

    set amount(v: number) {
        this._amount = v;
        this.redraw();
    }

    get amount() {
        return this._amount;
    }

    useDefault() {
        return this._amount === 0;
    }

    setupUniforms(operation: WebGLCoreQuadOperation) {
        super.setupUniforms(operation);
        this._setUniform('amount', this._amount, this.gl.uniform1f);
    }
}

InversionShader.prototype.fragmentShaderSource = `
    #ifdef GL_ES
    precision lowp float;
    #endif
    varying vec2 vTextureCoord;
    varying vec4 vColor;
    uniform sampler2D uSampler;
    uniform float amount;
    void main(void){
        vec4 color = texture2D(uSampler, vTextureCoord);
        color.rgb = color.rgb * (1.0 - amount) + amount * (1.0 * color.a - color.rgb); 
        gl_FragColor = color * vColor;
    }
`;
