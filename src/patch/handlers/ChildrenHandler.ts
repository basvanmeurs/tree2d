import Utils from "../../tree/Utils";
import Patcher from "../Patcher";
import Handler from "./Handler";
import Element from "../../tree/Element";
import ElementChildList from "../../tree/ElementChildList";

export default class ChildrenHandler extends Handler {
    handle(obj: any, settings: any): any {
        const childList = new ChildList(obj);
        childList.patch(settings);
    }
}

class ChildList {
    private element: Element;
    private c: ElementChildList;

    constructor(obj: Element) {
        this.element = obj;
        this.c = this.element.childList;
    }

    patch(settings: any) {
        if (Utils.isObjectLiteral(settings)) {
            this._setByObject(settings);
        } else if (Array.isArray(settings)) {
            this._setByArray(settings);
        }
    }

    getRefs(): Record<string, Element | undefined> {
        return this.c.getRefs();
    }

    getIndex(item: Element) {
        return this.c.getIndex(item);
    }

    add(item: Element, ensureNew = false) {
        this.c.add(item, ensureNew);
    }

    setAt(item: Element, index: number) {
        this.c.setAt(item, index);
    }

    _setByObject(settings: any) {
        // Overrule settings of known referenced items.
        const refs = this.getRefs();
        const crefs = Object.keys(settings);
        for (let i = 0, n = crefs.length; i < n; i++) {
            const cref = crefs[i];
            const s = settings[cref];

            let c = refs[cref];
            if (!c) {
                if (this.isItem(s)) {
                    // Replace previous item;
                    s.ref = cref;
                    this.add(s);
                } else {
                    // Create new item.
                    c = this.createItem(s);
                    c.ref = cref;
                    Patcher.patchObject(c, s);
                    this.add(c);
                }
            } else {
                if (this.isItem(s)) {
                    if (c !== s) {
                        // Replace previous item;
                        const idx = this.getIndex(c);
                        s.ref = cref;
                        this.setAt(s, idx);
                    }
                } else {
                    Patcher.patchObject(c, s);
                }
            }
        }
    }

    _equalsArray(array: any[]) {
        let same = true;
        const items = this.c.getItems();
        if (array.length === items.length) {
            for (let i = 0, n = items.length; i < n && same; i++) {
                same = same && items[i] === array[i];
            }
        } else {
            same = false;
        }
        return same;
    }

    _setByArray(array: any[]) {
        // For performance reasons, first check if the arrays match exactly and bail out if they do.
        if (this._equalsArray(array)) {
            return;
        }

        const items = this.c.getItems();

        let refs;
        const newItems = [];
        for (let i = 0, n = array.length; i < n; i++) {
            const s = array[i];
            if (this.isItem(s)) {
                newItems.push(s);
            } else {
                const cref = s.ref;
                let c;
                if (cref) {
                    if (!refs) refs = this.getRefs();
                    c = refs[cref];
                }

                if (!c) {
                    // Create new item.
                    c = this.createItem(s);
                }

                if (Utils.isObjectLiteral(s)) {
                    Patcher.patchObject(c, s);
                }

                newItems.push(c);
            }
        }

        this.c.setItems(newItems);
    }

    createItem(object: any): Element {
        return Patcher.createObject(object, Element, this.element.stage);
    }

    isItem(object: any) {
        return object instanceof Element;
    }
}
