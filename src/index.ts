import Patcher from "./patch/Patcher";
import Utils from "./tree/Utils";
import StageUtils from "./tree/StageUtils";
import Element from "./tree/Element";
import ElementCore from "./tree/core/ElementCore";
import ElementTexturizer from "./tree/core/ElementTexturizer";
import Texture from "./tree/Texture";

import ObjMerger from "./tools/ObjMerger";
import ObjectListProxy from "./tools/ObjectListProxy";
import ObjectListWrapper from "./tools/ObjectListWrapper";

import RectangleTexture from "./textures/RectangleTexture";
import NoiseTexture from "./textures/NoiseTexture";
import TextTexture from "./textures/text/TextTexture";
import ImageTexture from "./textures/ImageTexture";
import HtmlTexture from "./textures/HtmlTexture";
import RoundRectTexture from "./textures/RoundRectTexture";
import ShadowRectTexture from "./textures/ShadowRectTexture";
import SourceTexture from "./textures/SourceTexture";

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
import RadialGradientShader from "./renderer/webgl/shaders/RadialGradientShader.js";
import Light3dShader from "./renderer/webgl/shaders/Light3dShader";

import C2dShader from "./renderer/c2d/C2dShader";
import C2dDefaultShader from "./renderer/c2d/shaders/DefaultShader";
import { C2dGrayscaleShader } from "./renderer/common/shaders/GrayscaleShader";
import C2dBlurShader from "./renderer/c2d/shaders/BlurShader";

import Stage from "./tree/Stage";

import FlexNode from "./flex/FlexNode";
import FlexLayouter from "./flex/layout/FlexLayouter";
import FlexContainer from "./flex/FlexContainer";

const index = {
    Patcher,
    Utils,
    StageUtils,
    Element,
    Stage,
    ElementCore,
    ElementTexturizer,
    Texture,
    FlexNode,
    FlexLayouter,
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
        RoundRectTexture,
        ShadowRectTexture,
        SourceTexture
    },
    tools: {
        ObjMerger,
        ObjectListProxy,
        ObjectListWrapper
    }
};

declare const window: any;

(window as any).lng = index;

export default index;
