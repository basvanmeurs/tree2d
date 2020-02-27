import CoreContext from "./core/CoreContext";
import ElementCore from "./core/ElementCore";

export default class Shader {
    protected ctx: CoreContext;

    // The (enabled) elements that use this shader.
    private _elements = new Set<ElementCore>();

    constructor(coreContext: CoreContext) {
        this.ctx = coreContext;
    }

    static getWebGL() {
        return undefined;
    }

    static getC2d() {
        return undefined;
    }

    addElement(elementCore: ElementCore) {
        this._elements.add(elementCore);
    }

    removeElement(elementCore: ElementCore) {
        this._elements.delete(elementCore);
        if (!this._elements) {
            this.cleanup();
        }
    }

    redraw() {
        this._elements.forEach(elementCore => {
            elementCore.setHasRenderUpdates(2);
        });
    }

    useDefault() {
        // Should return true if this shader is configured (using it's properties) to not have any effect.
        // This may allow the render engine to avoid unnecessary shader program switches or even texture copies.
        return false;
    }

    addEmpty() {
        // Draws this shader even if there are no quads to be added.
        // This is handy for custom shaders.
        return false;
    }

    cleanup() {
        // Called when no more enabled elements have this shader.
    }
}
