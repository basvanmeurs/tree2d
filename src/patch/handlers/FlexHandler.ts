import Handler from "./Handler";
import Element from "../../tree/Element";
import Patcher from "../Patcher";

export default class FlexHandler extends Handler {
    handle(obj: any, settings: any) {
        const el = obj as Element;

        if (settings === undefined) {
            if (el.core.layout) {
                el.core.layout.setEnabled(false);
            }
        } else {
            el.core.layout.setEnabled(true);
            Patcher.patchObject(el.core.layout.flex, settings);
        }
    }
}
