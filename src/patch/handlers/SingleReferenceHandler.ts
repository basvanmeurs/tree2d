import Handler, { Constructor } from "./Handler";
import Patcher from "../Patcher";
type CArgsGetter = (obj: any) => any[];

export class SingleReferenceHandler extends Handler {
    private type: Constructor<any>;
    private getCArgs: CArgsGetter;

    constructor(sourceType: Constructor<any>, name: string, type: Constructor<any>, getCArgs?: CArgsGetter) {
        super(sourceType, name);
        this.type = type;
        if (!getCArgs) {
            getCArgs = (obj: any) => {
                return [];
            };
        }
        this.getCArgs = getCArgs;
    }

    handle(obj: any, settings: any): any {
        const value = obj[this.name];
        if (!settings) {
            obj[this.name] = undefined;
        } else if (settings.type && (!value || value.type !== settings.type)) {
            const cargs = this.getCArgs(obj);
            obj[this.name] = Patcher.createObject(settings, this.type, ...cargs);
        } else {
            if (value) {
                Patcher.patchObject(value, settings);
            } else {
                obj[this.name] = undefined;
            }
        }
    }
}