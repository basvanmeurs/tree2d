import { C2dDefaultShader } from "./C2dDefaultShader";
import { CoreContext } from "../../../tree/core/CoreContext";
import { WebGLGrayscaleShader } from "../../webgl/shaders/WebGLGrayscaleShader";

export class C2dGrayscaleShader extends C2dDefaultShader {
    private _amount: number = 1;

    constructor(context: CoreContext) {
        super(context);
    }

    static getWebGL() {
        return WebGLGrayscaleShader;
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

    _beforeDrawEl(obj: any) {
        obj.target.context.filter = "grayscale(" + this._amount + ")";
    }

    _afterDrawEl(obj: any) {
        obj.target.context.filter = "none";
    }
}
