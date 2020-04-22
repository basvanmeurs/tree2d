import { C2dDefaultShader } from "./C2dDefaultShader";

export class C2dBlurShader extends C2dDefaultShader {
    private _kernelRadius: number = 1;

    get kernelRadius() {
        return this._kernelRadius;
    }

    set kernelRadius(v) {
        this._kernelRadius = v;
        this.redraw();
    }

    useDefault() {
        return this._kernelRadius === 0;
    }

    _beforeDrawEl(info: any) {
        info.target.context.filter = "blur(" + this._kernelRadius + "px)";
    }

    _afterDrawEl(info: any) {
        info.target.context.filter = "none";
    }
}
