import { handlers } from "./handlers/handlers";
import { Constructor } from "../util/types";

export class Patcher {
    static createObject<T>(settings: any, defaultType: Constructor<T> | undefined, ...cargs: any[]): T {
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
            handler.handle(obj, value);
        } else {
            this.patchSimpleObjectProperty(obj, name, value);
        }
    }

    static patchSimpleObjectProperty(obj: any, name: string, value: any) {
        if (name !== "type") {
            obj[name] = value;
        }
    }

    static getHandler(obj: any, prop: string) {
        return handlers.find((handler) => handler.matches(obj, prop));
    }
}
