import CoreQuadList from '../../tree/core/CoreQuadList';
import ElementCoreContext from '../../tree/core/ElementCoreContext';

export default class C2dCoreQuadList extends CoreQuadList {
    private renderContexts: ElementCoreContext[] = [];
    private modes: number[] = [];

    setRenderContext(index: number, v: ElementCoreContext) {
        this.renderContexts[index] = v;
    }

    setSimpleTc(index: number, v: boolean) {
        if (v) {
            this.modes[index] |= 1;
        } else {
            this.modes[index] -= this.modes[index] & 1;
        }
    }

    setWhite(index: number, v: boolean) {
        if (v) {
            this.modes[index] |= 2;
        } else {
            this.modes[index] -= this.modes[index] & 2;
        }
    }

    getRenderContext(index: number) {
        return this.renderContexts[index];
    }

    getSimpleTc(index: number) {
        return this.modes[index] & 1;
    }

    getWhite(index: number) {
        return this.modes[index] & 2;
    }
}
