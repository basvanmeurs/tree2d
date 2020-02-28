import Handler from "./Handler";
import Element from "../../tree/Element";
import Patcher from "../Patcher";

export default class FlexItemHandler extends Handler {
    handle(obj: any, settings: any) {
        const el = obj as Element;
        if (!settings) {
            el.core.layout.setItemEnabled(false);
        } else {
            el.core.layout.setItemEnabled(true);
            Patcher.patchObject(el.core.layout.flexItem, settings);
        }
    }
}
