import WebPlatform from "./browser/WebPlatform";

export default class PlatformLoader {
    static load(options) {
        if (options.platform) {
            return options.platform;
        } else {
            return WebPlatform;
        }
    }
}