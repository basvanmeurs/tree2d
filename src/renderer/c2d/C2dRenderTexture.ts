import RenderTexture from "../RenderTexture";

export default interface C2dRenderTexture extends RenderTexture, HTMLCanvasElement {
    context: CanvasRenderingContext2D;
}
