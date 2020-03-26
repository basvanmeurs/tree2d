import NativeTexture from "../../renderer/NativeTexture";
import ElementCore from "./ElementCore";

export default class CoreQuadList {
    private quadTextures: NativeTexture[] = [];
    private quadElementCores: ElementCore[] = [];

    get length() {
        return this.quadTextures.length;
    }

    reset() {
        this.quadTextures = [];
        this.quadElementCores = [];
    }

    getElement(index: number) {
        return this.quadElementCores[index].element;
    }

    getElementCore(index: number) {
        return this.quadElementCores[index];
    }

    getTexture(index: number) {
        return this.quadTextures[index];
    }

    getTextureWidth(index: number) {
        const nativeTexture = this.quadTextures[index];
        if (nativeTexture.w) {
            // Render texture;
            return nativeTexture.w;
        } else {
            return this.quadElementCores[index].displayedTextureSource!.w;
        }
    }

    getTextureHeight(index: number) {
        const nativeTexture = this.quadTextures[index];
        if (nativeTexture.h) {
            // Render texture;
            return nativeTexture.h;
        } else {
            return this.quadElementCores[index].displayedTextureSource!.h;
        }
    }

    add(texture: NativeTexture, elementCore: ElementCore) {
        this.quadTextures.push(texture);
        this.quadElementCores.push(elementCore);
    }
}
