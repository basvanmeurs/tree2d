import { SingleReferenceHandler } from "./SingleReferenceHandler";
import Element from "../../tree/Element";
import Shader from "../../tree/Shader";
import { Constructor } from "../../util/types";

export class ShaderHandler extends SingleReferenceHandler {
    constructor(sourceType: Constructor<Element>, name: string) {
        super(sourceType, name, Shader, (obj) => [obj.stage.context]);
    }

    handle(obj: any, settings: any) {
        if (settings && settings.type) {
            const type = (obj as Element).stage.renderer.getSupportedShaderType(settings.type);
            if (!type) {
                console.warn("Shader has no implementation for render target: " + settings.type.name);
                obj[this.name] = undefined;
                return;
            }
            if (type !== settings.type) {
                return super.handle(obj, Object.assign({}, settings, { type }));
            }
        }
        super.handle(obj, settings);
    }
}
