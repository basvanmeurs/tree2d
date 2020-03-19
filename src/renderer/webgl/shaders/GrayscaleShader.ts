import WebGLDefaultShader from './DefaultShader';
import CoreContext from '../../../tree/core/CoreContext';
import WebGLCoreQuadOperation from '../WebGLCoreQuadOperation';
import C2dGrayscaleShader from '../../c2d/shaders/GrayscaleShader';

export default class GrayscaleShader extends WebGLDefaultShader {
  private _amount: number = 1;

  constructor(context: CoreContext) {
    super(context);
  }

  static getC2d() {
    return C2dGrayscaleShader;
  }

  set amount(v) {
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

GrayscaleShader.prototype.fragmentShaderSource = `
    #ifdef GL_ES
    precision lowp float;
    #endif
    varying vec2 vTextureCoord;
    varying vec4 vColor;
    uniform sampler2D uSampler;
    uniform float amount;
    void main(void){
        vec4 color = texture2D(uSampler, vTextureCoord) * vColor;
        float grayness = 0.2 * color.r + 0.6 * color.g + 0.2 * color.b;
        gl_FragColor = vec4(amount * vec3(grayness, grayness, grayness) + (1.0 - amount) * color.rgb, color.a);
    }
`;
