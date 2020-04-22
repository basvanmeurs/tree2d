import { ImageWorker } from "./ImageWorker";

export class ImageWorkerImage {
    private _onError?: (error: Error) => void;
    private _onLoad?: (info: any) => void;

    constructor(private manager: ImageWorker, public id: number, public src: string) {}

    set onError(f: (error: Error) => void | undefined) {
        this._onError = f;
    }

    set onLoad(f: (info: any) => void | undefined) {
        this._onLoad = f;
    }

    cancel() {
        this.manager.cancel(this);
    }

    load(info: any) {
        if (this._onLoad) {
            this._onLoad(info);
        }
    }

    error(info: Error) {
        if (this._onError) {
            this._onError(info);
        }
    }
}
