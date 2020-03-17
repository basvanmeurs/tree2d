import CoreQuadOperation from "../../tree/core/CoreQuadOperation";
import C2dCoreQuadList from "./C2dCoreQuadList";

export default class C2dCoreQuadOperation extends CoreQuadOperation {
    get quadList(): C2dCoreQuadList {
        return super.quadList as C2dCoreQuadList;
    }

    getRenderContext(index: number) {
        return this.quadList.getRenderContext(this.index + index);
    }

    getSimpleTc(index: number) {
        return this.quadList.getSimpleTc(this.index + index);
    }

    getWhite(index: number) {
        return this.quadList.getWhite(this.index + index);
    }
}
