import NativeTexture from '../../renderer/NativeTexture';
import RenderTexture from '../../renderer/RenderTexture';

export interface RenderTextureInfo {
  renderTexture?: RenderTexture;
  reusableTexture?: NativeTexture;
  reusableRenderStateOffset: number;
  w: number;
  h: number;
  empty: boolean;
  cleared: boolean;
  ignore: boolean;
  cache: boolean;
}
