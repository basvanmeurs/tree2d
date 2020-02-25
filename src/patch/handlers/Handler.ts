import Patcher from "../Patcher";

export type Constructor<T> = new (...args: any[]) => T;

export default class Handler {
    private sourceType: Constructor<any>;
    public name: string;

    constructor(sourceType: Constructor<any>, name: string) {
        this.sourceType = sourceType;
        this.name = name;
    }

    matches(obj: any, prop: string) {
        return this.name === prop && obj instanceof this.sourceType;
    }

    handle(obj: any, settings: any): any {
        const value = obj[this.name];
        if (!settings) {
            obj[this.name] = undefined;
        } else {
            Patcher.patchObject(value, settings);
        }
    }
}

