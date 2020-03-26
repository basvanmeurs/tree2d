export default class Utils {
    static isFunction(value: any): value is (...args: any) => any {
        return typeof value === "function";
    }

    static isNumber(value: any): value is number {
        return typeof value === "number";
    }

    static isInteger(value: any): value is number {
        return typeof value === "number" && value % 1 === 0;
    }

    static isBoolean(value: any): value is boolean {
        return value === true || value === false;
    }

    static isString(value: any): value is string {
        return typeof value === "string";
    }

    static clone(v: any) {
        if (Utils.isObjectLiteral(v) || Array.isArray(v)) {
            return Utils.getDeepClone(v);
        } else {
            // Copy by value.
            return v;
        }
    }

    static cloneObjShallow<T extends object>(obj: T): T {
        const keys = Object.keys(obj);
        const clone: T = {} as T;
        for (const k of Object.keys(obj)) {
            (clone as any)[k] = (obj as any)[k];
        }
        return clone;
    }

    static merge<T extends object>(obj1: T, obj2: T): T {
        for (const k of Object.keys(obj2)) {
            (obj1 as any)[k] = (obj2 as any)[k];
        }
        return obj1;
    }

    static isObject(value: any) {
        const type = typeof value;
        return !!value && (type === "object" || type === "function");
    }

    static isPlainObject(value: any) {
        const type = typeof value;
        return !!value && type === "object";
    }

    static isObjectLiteral(value: any) {
        return typeof value === "object" && value && value.constructor === Object;
    }

    static getArrayIndex(index: number, arr: any[]) {
        return Utils.getModuloIndex(index, arr.length);
    }

    static getModuloIndex(index: number, len: number) {
        if (len === 0) return index;
        while (index < 0) {
            index += Math.ceil(-index / len) * len;
        }
        index = index % len;
        return index;
    }

    static getDeepClone<T extends object>(obj: T): T {
        if (Utils.isFunction(obj)) {
            // Copy functions by reference.
            return obj;
        }
        if (Array.isArray(obj)) {
            const c: any[] = [];
            for (const key of Object.keys(obj)) {
                const v = (obj as any)[key] as any;
                (c as any)[key] = Utils.getDeepClone(v);
            }
            return c as T;
        } else if (Utils.isObject(obj)) {
            const c: any = {};
            for (const key of Object.keys(obj)) {
                const v = (obj as any)[key] as any;
                (c as any)[key] = Utils.getDeepClone(v);
            }
            return c;
        } else {
            return obj;
        }
    }

    static equalValues(v1: any, v2: any): boolean {
        if (typeof v1 !== typeof v2) return false;
        if (Utils.isObjectLiteral(v1)) {
            return Utils.isObjectLiteral(v2) && Utils.equalObjectLiterals(v1, v2);
        } else if (Array.isArray(v1)) {
            return Array.isArray(v2) && Utils.equalArrays(v1, v2);
        } else {
            return v1 === v2;
        }
    }

    static equalObjectLiterals<T extends object>(obj1: T, obj2: T) {
        const keys1 = Object.keys(obj1) as (keyof T)[];
        const keys2 = Object.keys(obj2) as (keyof T)[];
        if (keys1.length !== keys2.length) {
            return false;
        }

        for (let i = 0, n = keys1.length; i < n; i++) {
            const k1 = keys1[i];
            const k2 = keys2[i];
            if (k1 !== k2) {
                return false;
            }

            const v1 = obj1[k1];
            const v2 = obj2[k2];

            if (!Utils.equalValues(v1, v2)) {
                return false;
            }
        }

        return true;
    }

    static equalArrays<T extends any[]>(v1: T, v2: T) {
        if (v1.length !== v2.length) {
            return false;
        }
        for (let i = 0, n = v1.length; i < n; i++) {
            if (!this.equalValues(v1[i], v2[i])) {
                return false;
            }
        }

        return true;
    }

    static setToArray<T>(s: Set<T>): T[] {
        const result = new Array<T>();
        s.forEach((value) => {
            result.push(value);
        });
        return result;
    }

    static iteratorToArray<T>(iterator: Iterator<T, any, any>): T[] {
        const result = [];
        let iteratorResult = iterator.next();
        while (!iteratorResult.done) {
            result.push(iteratorResult.value);
            iteratorResult = iterator.next();
        }
        return result;
    }

    static isUcChar(charcode: number) {
        return charcode >= 65 && charcode <= 90;
    }
}
