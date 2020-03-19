import createWorker from "./createWorker";
import {ImageWorkerImage} from "./ImageWorkerImage";

export default class ImageWorker {

  private _items = new Map<number, ImageWorkerImage>();
  private _id: number = 0;
  private _worker: Worker;

  constructor() {
    this._worker = createWorker();

    this._worker.postMessage({ type: 'config', config: { path: window.location.href } });

    this._worker.onmessage = e => {
      if (e.data && e.data.id) {
        const id = e.data.id;
        const item = this._items.get(id);
        if (item) {
          if (e.data.type === 'data') {
            this.finish(item, e.data.info);
          } else {
            this.error(item, new Error(`Image loading error type ${e.data.info.type}: ${e.data.info.message}`));
          }
        }
      }
    };
  }

  destroy() {
    if (this._worker) {
      this._worker.terminate();
    }
  }

  create(src: string): ImageWorkerImage {
    const id = ++this._id;
    const item = new ImageWorkerImage(this, id, src);
    this._items.set(id, item);
    this._worker.postMessage({ type: 'add', id, src });
    return item;
  }

  cancel(image: ImageWorkerImage) {
    this._worker.postMessage({ type: 'cancel', id: image.id });
    this._items.delete(image.id);
  }

  error(image: ImageWorkerImage, info: Error) {
    image.error(info);
    this._items.delete(image.id);
  }

  finish(image: ImageWorkerImage, info: any) {
    image.load(info);
    this._items.delete(image.id);
  }
}

