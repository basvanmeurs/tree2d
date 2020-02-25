export default class Renderer {
    constructor(stage) {
        this.stage = stage;
        this._defaultShader = undefined;
    }

    gc(aggressive) {}

    destroy() {}

    getDefaultShader(ctx = this.stage.ctx) {
        if (!this._defaultShader) {
            this._defaultShader = this._createDefaultShader(ctx);
        }
        return this._defaultShader;
    }

    _createDefaultShader(ctx) {}

    isValidShaderType(shaderType) {
        return shaderType.prototype instanceof this._getShaderBaseType();
    }

    getSupportedShaderType(shaderType) {
        if (!this.isValidShaderType(shaderType)) {
            const convertedShaderType = this._getShaderAlternative(shaderType);
            if (!convertedShaderType) {
                return undefined;
            }
            return convertedShaderType;
        } else {
            return shaderType;
        }
    }

    _getShaderBaseType() {}

    _getShaderAlternative(shaderType) {
        return this.getDefaultShader();
    }

    copyRenderTexture(renderTexture, nativeTexture, options) {
        console.warn("copyRenderTexture not supported by renderer");
    }
}

import Patcher from "../patch/Patcher";
