export default class CoreQuadList {
    constructor(context) {
        this.context = context;

        this.quadTextures = [];

        this.quadElements = [];
    }

    get length() {
        return this.quadTextures.length;
    }

    reset() {
        this.quadTextures = [];
        this.quadElements = [];
        this.dataLength = 0;
    }

    getElement(index) {
        return this.quadElements[index]._element;
    }

    getElementCore(index) {
        return this.quadElements[index];
    }

    getTexture(index) {
        return this.quadTextures[index];
    }

    getTextureWidth(index) {
        const nativeTexture = this.quadTextures[index];
        if (nativeTexture.w) {
            // Render texture;
            return nativeTexture.w;
        } else {
            return this.quadElements[index]._displayedTextureSource.w;
        }
    }

    getTextureHeight(index) {
        const nativeTexture = this.quadTextures[index];
        if (nativeTexture.h) {
            // Render texture;
            return nativeTexture.h;
        } else {
            return this.quadElements[index]._displayedTextureSource.h;
        }
    }
}
