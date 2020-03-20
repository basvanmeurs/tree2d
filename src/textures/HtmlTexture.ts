import Texture, { TextureSourceCallback, TextureSourceLoader } from '../tree/Texture';

export default class HtmlTexture extends Texture {
    private _htmlElement?: HTMLElement;

    private _scale = 1;

    private static _preloadArea?: HTMLDivElement;

    set htmlElement(v) {
        this._htmlElement = v;
        this._changed();
    }

    get htmlElement() {
        return this._htmlElement;
    }

    set scale(v) {
        this._scale = v;
        this._changed();
    }

    get scale() {
        return this._scale;
    }

    set html(v) {
        if (!v) {
            this.htmlElement = undefined;
        } else {
            const d = document.createElement('div');
            d.innerHTML = '<div>' + v + '</div>';
            if (d.firstElementChild) {
                this.htmlElement = d.firstElementChild as HTMLElement;
            }
        }
    }

    get html() {
        return this._htmlElement ? this._htmlElement.innerHTML : '';
    }

    protected _getIsValid() {
        return !!this.htmlElement;
    }

    protected _getLookupId() {
        return this._scale + ':' + this.html;
    }

    _getSourceLoader(): TextureSourceLoader {
        const htmlElement = this._htmlElement!;
        const scale = this._scale;
        return (cb: TextureSourceCallback) => {
            const html2canvas: any = (window as any).html2canvas;
            if (!(window as any).html2canvas) {
                return cb(new Error('Please include html2canvas (https://html2canvas.hertzen.com/)'));
            }

            const area = HtmlTexture.getPreloadArea();
            area.appendChild(htmlElement);

            html2canvas(htmlElement, { backgroundColor: null, scale })
                .then((canvas: HTMLCanvasElement) => {
                    area.removeChild(htmlElement);
                    if (canvas.height === 0) {
                        return cb(new Error('Canvas height is 0'));
                    }
                    cb(undefined, { source: canvas, width: canvas.width, height: canvas.height });
                })
                .catch((e: any) => {
                    console.error(e);
                });
        };
    }

    static getPreloadArea() {
        if (!this._preloadArea) {
            // Preload area must be included in document body and must be visible to trigger html element rendering.
            this._preloadArea = document.createElement('div');
            if (this._preloadArea.attachShadow) {
                // Use a shadow DOM if possible to prevent styling from interfering.
                this._preloadArea.attachShadow({ mode: 'closed' });
            }
            this._preloadArea.style.opacity = '0';
            this._preloadArea.style.pointerEvents = 'none';
            this._preloadArea.style.position = 'fixed';
            this._preloadArea.style.display = 'block';
            this._preloadArea.style.top = '100vh';
            this._preloadArea.style.overflow = 'hidden';
            document.body.appendChild(this._preloadArea);
        }
        return this._preloadArea;
    }
}
