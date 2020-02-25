import TextTexture from "../textures/TextTexture";

type Constructor<T> = new (...args: any[]) => T;
type CArgsGetter = (obj: any) => any[];
class Handler {
    public name: string;
    private type: Constructor<any>;
    private getCArgs: CArgsGetter;
    private sourceType: Constructor<any>;

    constructor(sourceType: Constructor<any>, name: string, type: Constructor<any>, getCArgs?: (obj: any) => any[]) {
        this.sourceType = sourceType;
        this.name = name;
        this.type = type;
        if (!getCArgs) {
            getCArgs = (obj: any) => {
                return [];
            };
        }
        this.getCArgs = getCArgs;
    }

    matches(obj: any, prop: string) {
        return this.name === prop && obj instanceof this.sourceType;
    }

    handle(obj: any, settings: any): any {
        const value = obj[name];
        if (!settings) {
            return undefined;
        } else if (settings.type && (!value || value.type !== settings.type)) {
            return Base.createObject(settings, this.type, this.getCArgs(obj));
        } else {
            if (value) {
                Base.patchObject(value, settings);
                return value;
            } else {
                return undefined;
            }
        }
    }
}

class TextHandler extends Handler {
    handle(obj: any, settings: any) {
        if (!obj.texture || !(obj.texture instanceof TextTexture)) {
            obj.enableTextTexture();
        }
        if (Utils.isString(settings)) {
            Base.patchObjectProperty(obj.texture, "text", settings);
        } else {
            Base.patchObject(obj.texture, settings);
        }
    }
}

export default class Base {
    static defaultSetter(obj: any, name: string, value: any) {
        obj[name] = value;
    }

    static createObject(settings: any, defaultType: Constructor<any> | undefined, ...cargs: any[]) {
        let object;
        if (settings.type) {
            object = new settings.type(...cargs);
        } else {
            if (!defaultType) {
                throw new Error("No default type specified");
            }
            object = new defaultType(...cargs);
        }

        this.patchObject(object, settings);

        return object;
    }

    static patchObject(obj: any, settings: object) {
        const names = Object.keys(settings);
        for (let i = 0, n = names.length; i < n; i++) {
            const name = names[i];
            const value = (settings as any)[name];
            this.patchObjectProperty(obj, name, value);
        }
    }

    static patchObjectProperty(obj: any, name: string, value: any) {
        const handler = this.getHandler(obj, name);
        if (handler) {
            obj[name] = handler.handle(obj, value);
        } else {
            this.patchSimpleObjectProperty(obj, name, value);
        }
    }

    static patchSimpleObjectProperty(obj: any, name: string, value: any) {
        const setter = obj.setSetting || Base.defaultSetter;

        if (name.charAt(0) === "_") {
            // Disallow patching private variables.
            if (name !== "__create") {
                console.error("Patch of private property '" + name + "' is not allowed");
            }
        } else if (name !== "type") {
            // Type is a reserved keyword to specify the class type on creation.
            if (Utils.isFunction(value) && value.__local) {
                // Local function (Base.local(s => s.something))
                value = value.__local(obj);
            }

            setter(obj, name, value);
        }
    }

    static handlers = [
        new Handler(Element, "texture", Texture, obj => [obj.stage]),
        new Handler(Element, "shader", Shader, obj => [obj.stage.ctx]),
        new TextHandler(Element, "text", TextTexture)

    ];

    static getHandler(obj: any, prop: string) {
        return this.handlers.find(handler => handler.matches(obj, prop));
    }

}


import Utils from "./Utils";
import Element from "./Element";
import Shader from "./Shader";
import Texture from "./Texture";
