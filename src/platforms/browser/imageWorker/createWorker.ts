export default function createWorker() {
    const code = `(${createWorkerServer.toString()})()`;
    const blob = new Blob([code.replace('"use strict";', '')]); // firefox adds "use strict"; to any function which might block worker execution so knock it off
    const blobURL = ((window.URL ? URL : window.webkitURL).createObjectURL as any)(blob, {
        type: 'application/javascript; charset=utf-8',
    });
    return new Worker(blobURL);
}

/**
 * Notice that, within the createWorker function, we must only use ES5 code to keep it ES5-valid after babelifying, as
 *  the converted code of this section is converted to a blob and used as the js of the web worker thread.
 */
function createWorkerServer() {
    class ImageWorkerServer {
        private items = new Map<string, ImageWorkerServerItem>();
        private config?: any;
        private relativeBase?: string;

        constructor() {
            onmessage = e => {
                this._receiveMessage(e);
            };
        }

        static isPathAbsolute(path: string) {
            return /^(?:\/|[a-z]+:\/\/)/.test(path);
        }

        _receiveMessage(e: any) {
            if (e.data.type === 'config') {
                this.config = e.data.config;

                const base = this.config.path;
                const parts = base.split('/');
                parts.pop();
                this.relativeBase = parts.join('/') + '/';
            } else if (e.data.type === 'add') {
                this.add(e.data.id, e.data.src);
            } else if (e.data.type === 'cancel') {
                this.cancel(e.data.id);
            }
        }

        add(id: string, src: string) {
            // Convert relative URLs.
            if (this.relativeBase && !ImageWorkerServer.isPathAbsolute(src)) {
                src = this.relativeBase + src;
            }

            if (src.substr(0, 2) === '//') {
                // This doesn't work for image workers.
                src = 'http:' + src;
            }

            const item = new ImageWorkerServerItem(id, src);
            item.onFinish = (result: any) => {
                this.finish(item, result);
            };
            item.onError = (info: any) => {
                this.error(item, info);
            };
            this.items.set(id, item);
            item.start();
        }

        cancel(id: string) {
            const item = this.items.get(id);
            if (item) {
                item.cancel();
                this.items.delete(id);
            }
        }

        finish(item: ImageWorkerServerItem, info: any) {
            const { imageBitmap, hasAlphaChannel } = info;
            (postMessage as any)(
                {
                    type: 'data',
                    id: item.id,
                    info: {
                        imageBitmap,
                        hasAlphaChannel,
                    },
                },
                [imageBitmap],
            );
            this.items.delete(item.id);
        }

        error(item: ImageWorkerServerItem, info: any) {
            const { type, message } = info;
            (postMessage as any)({
                type: 'error',
                id: item.id,
                info: {
                    type,
                    message,
                },
            });
            this.items.delete(item.id);
        }
    }

    class ImageWorkerServerItem {
        public onError?: (info: any) => void;
        public onFinish?: (info: any) => void;

        private xhr?: XMLHttpRequest;

        private mimeType?: string;

        private canceled = false;

        constructor(public readonly id: string, public readonly src: string) {}

        start() {
            this.xhr = new XMLHttpRequest();
            this.xhr.open('GET', this.src, true);
            this.xhr.responseType = 'blob';

            this.xhr.onerror = oEvent => {
                this.error('connection', 'Connection error');
            };

            this.xhr.onload = oEvent => {
                const blob = this.xhr!.response;
                this.mimeType = blob.type;

                this.createImageBitmap(blob);
            };

            this.xhr.send();
        }

        private createImageBitmap(blob: any) {
            (createImageBitmap as any)(blob, {
                premultiplyAlpha: 'premultiply',
                colorSpaceConversion: 'none',
                imageOrientation: 'none',
            })
                .then((imageBitmap: ImageBitmap) => {
                    this.finish({
                        imageBitmap,
                        hasAlphaChannel: this.hasAlphaChannel(),
                    });
                })
                .catch(() => {
                    this.error('parse', 'Error parsing image data');
                });
        }

        private hasAlphaChannel() {
            return this.mimeType && this.mimeType.indexOf('image/png') !== -1;
        }

        cancel() {
            if (this.canceled) return;
            if (this.xhr) {
                this.xhr.abort();
            }
            this.canceled = true;
        }

        private error(type: string, message: string) {
            if (!this.canceled && this.onError) {
                this.onError({ type, message });
            }
        }

        finish(info: any) {
            if (!this.canceled && this.onFinish) {
                this.onFinish(info);
            }
        }
    }

    const worker = new ImageWorkerServer();
}
