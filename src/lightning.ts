import Base from "./tree/Base";
import Utils from "./tree/Utils";
import StageUtils from "./tree/StageUtils";
import Element from "./tree/Element";
import ElementCore from "./tree/core/ElementCore";
import ElementTexturizer from "./tree/core/ElementTexturizer";
import Texture from "./tree/Texture";

import Tools from "./tools/Tools";
import ObjMerger from "./tools/ObjMerger";
import ObjectListProxy from "./tools/ObjectListProxy";
import ObjectListWrapper from "./tools/ObjectListWrapper";

import RectangleTexture from "./textures/RectangleTexture";
import NoiseTexture from "./textures/NoiseTexture";
import TextTexture from "./textures/TextTexture";
import ImageTexture from "./textures/ImageTexture";
import HtmlTexture from "./textures/HtmlTexture";
import StaticTexture from "./textures/StaticTexture";
import StaticCanvasTexture from "./textures/StaticCanvasTexture";
import SourceTexture from "./textures/SourceTexture";

import EventEmitter from "./EventEmitter";

import WebGLShader from "./renderer/webgl/WebGLShader";
import WebGLDefaultShader from "./renderer/webgl/shaders/DefaultShader";
import { WebGLGrayscaleShader } from "./renderer/common/shaders/GrayscaleShader";
import BoxBlurShader from "./renderer/webgl/shaders/BoxBlurShader";
import DitheringShader from "./renderer/webgl/shaders/DitheringShader";
import CircularPushShader from "./renderer/webgl/shaders/CircularPushShader";
import InversionShader from "./renderer/webgl/shaders/InversionShader";
import LinearBlurShader from "./renderer/webgl/shaders/LinearBlurShader";
import OutlineShader from "./renderer/webgl/shaders/OutlineShader";
import PixelateShader from "./renderer/webgl/shaders/PixelateShader";
import RadialFilterShader from "./renderer/webgl/shaders/RadialFilterShader";
import RoundedRectangleShader from "./renderer/webgl/shaders/RoundedRectangleShader";
import RadialGradientShader from "./renderer/webgl/shaders/RadialGradientShader";
import Light3dShader from "./renderer/webgl/shaders/Light3dShader";

import C2dShader from "./renderer/c2d/C2dShader";
import C2dDefaultShader from "./renderer/c2d/shaders/DefaultShader";
import { C2dGrayscaleShader } from "./renderer/common/shaders/GrayscaleShader";
import C2dBlurShader from "./renderer/c2d/shaders/BlurShader";

import Stage from "./tree/Stage";

import FlexTarget from "./flex/FlexTarget";
import FlexLayout from "./flex/layout/FlexLayout";
import FlexContainer from "./flex/FlexContainer";

const lightning = {
    Base,
    Utils,
    StageUtils,
    Element,
    Tools,
    Stage,
    ElementCore,
    ElementTexturizer,
    Texture,
    EventEmitter,
    FlexTarget,
    FlexLayout,
    FlexContainer,
    shaders: {
        Grayscale: WebGLGrayscaleShader,
        BoxBlur: BoxBlurShader,
        Dithering: DitheringShader,
        CircularPush: CircularPushShader,
        Inversion: InversionShader,
        LinearBlur: LinearBlurShader,
        Outline: OutlineShader,
        Pixelate: PixelateShader,
        RadialFilter: RadialFilterShader,
        RoundedRectangle: RoundedRectangleShader,
        RadialGradient: RadialGradientShader,
        Light3d: Light3dShader,
        WebGLShader,
        WebGLDefaultShader,
        C2dShader,
        C2dDefaultShader,
        c2d: {
            Grayscale: C2dGrayscaleShader,
            Blur: C2dBlurShader
        }
    },
    textures: {
        RectangleTexture,
        NoiseTexture,
        TextTexture,
        ImageTexture,
        HtmlTexture,
        StaticTexture,
        StaticCanvasTexture,
        SourceTexture
    },
    tools: {
        ObjMerger,
        ObjectListProxy,
        ObjectListWrapper
    }
};

if (Utils.isWeb) {
    (window as any).lng = lightning;
}

export default lightning;
