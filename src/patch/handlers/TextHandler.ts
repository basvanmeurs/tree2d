import Handler from './Handler';
import TextTexture from '../../textures/text/TextTexture';
import Utils from '../../tree/Utils';
import Patcher from '../Patcher';

export default class TextHandler extends Handler {
    handle(obj: any, settings: any) {
        if (!obj.texture || !(obj.texture instanceof TextTexture)) {
            obj.enableTextTexture();
        }
        if (Utils.isString(settings)) {
            Patcher.patchObjectProperty(obj.texture, 'text', settings);
        } else {
            Patcher.patchObject(obj.texture, settings);
        }
    }
}
