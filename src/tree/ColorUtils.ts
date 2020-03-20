export default class ColorUtils {
    static rgb(r: number, g: number, b: number) {
        return (r << 16) + (g << 8) + b + 255 * 16777216;
    }

    static rgba(r: number, g: number, b: number, a: number) {
        return (r << 16) + (g << 8) + b + ((a * 255) | 0) * 16777216;
    }

    static getRgbString(color: number) {
        const r = ((color / 65536) | 0) % 256;
        const g = ((color / 256) | 0) % 256;
        const b = color % 256;
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    }

    static getRgbaString(color: number): string {
        const r = ((color / 65536) | 0) % 256;
        const g = ((color / 256) | 0) % 256;
        const b = color % 256;
        const a = ((color / 16777216) | 0) / 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(4) + ')';
    }

    static getRgbaStringFromArray(color: number[]) {
        const r = Math.floor(color[0] * 255);
        const g = Math.floor(color[1] * 255);
        const b = Math.floor(color[2] * 255);
        const a = Math.floor(color[3] * 255) / 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(4) + ')';
    }

    static getRgbaComponentsNormalized(argb: number) {
        const r = ((argb / 65536) | 0) % 256;
        const g = ((argb / 256) | 0) % 256;
        const b = argb % 256;
        const a = (argb / 16777216) | 0;
        return [r / 255, g / 255, b / 255, a / 255];
    }

    static getRgbComponentsNormalized(argb: number) {
        const r = ((argb / 65536) | 0) % 256;
        const g = ((argb / 256) | 0) % 256;
        const b = argb % 256;
        return [r / 255, g / 255, b / 255];
    }

    static getRgbaComponents(argb: number) {
        const r = ((argb / 65536) | 0) % 256;
        const g = ((argb / 256) | 0) % 256;
        const b = argb % 256;
        const a = (argb / 16777216) | 0;
        return [r, g, b, a];
    }

    static getArgbNumber(rgba: number[]) {
        rgba[0] = Math.max(0, Math.min(255, rgba[0]));
        rgba[1] = Math.max(0, Math.min(255, rgba[1]));
        rgba[2] = Math.max(0, Math.min(255, rgba[2]));
        rgba[3] = Math.max(0, Math.min(255, rgba[3]));
        let v = ((rgba[3] | 0) << 24) + ((rgba[0] | 0) << 16) + ((rgba[1] | 0) << 8) + (rgba[2] | 0);
        if (v < 0) {
            v = 0xffffffff + v + 1;
        }
        return v;
    }

    static mergeColors(c1: number, c2: number, p: number) {
        const r1 = ((c1 / 65536) | 0) % 256;
        const g1 = ((c1 / 256) | 0) % 256;
        const b1 = c1 % 256;
        const a1 = (c1 / 16777216) | 0;

        const r2 = ((c2 / 65536) | 0) % 256;
        const g2 = ((c2 / 256) | 0) % 256;
        const b2 = c2 % 256;
        const a2 = (c2 / 16777216) | 0;

        const r = r1 * p + r2 * (1 - p);
        const g = g1 * p + g2 * (1 - p);
        const b = b1 * p + b2 * (1 - p);
        const a = a1 * p + a2 * (1 - p);

        return Math.round(a) * 16777216 + Math.round(r) * 65536 + Math.round(g) * 256 + Math.round(b);
    }

    static mergeMultiColors(c: number[], p: number[]) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let t = 0;
        const n = c.length;
        for (let i = 0; i < n; i++) {
            const r1 = ((c[i] / 65536) | 0) % 256;
            const g1 = ((c[i] / 256) | 0) % 256;
            const b1 = c[i] % 256;
            const a1 = (c[i] / 16777216) | 0;
            r += r1 * p[i];
            g += g1 * p[i];
            b += b1 * p[i];
            a += a1 * p[i];
            t += p[i];
        }

        t = 1 / t;
        return Math.round(a * t) * 16777216 + Math.round(r * t) * 65536 + Math.round(g * t) * 256 + Math.round(b * t);
    }

    static mergeMultiColorsEqual(c: number[]) {
        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let t = 0;
        const n = c.length;
        for (let i = 0; i < n; i++) {
            const r1 = ((c[i] / 65536) | 0) % 256;
            const g1 = ((c[i] / 256) | 0) % 256;
            const b1 = c[i] % 256;
            const a1 = (c[i] / 16777216) | 0;
            r += r1;
            g += g1;
            b += b1;
            a += a1;
            t += 1.0;
        }

        t = 1 / t;
        return Math.round(a * t) * 16777216 + Math.round(r * t) * 65536 + Math.round(g * t) * 256 + Math.round(b * t);
    }

    static mergeColorAlpha(c: number, alpha: number) {
        const a = (((c / 16777216) | 0) * alpha) | 0;
        return (
            (((((c >> 16) & 0xff) * a) / 255) & 0xff) +
            ((((c & 0xff00) * a) / 255) & 0xff00) +
            (((((c & 0xff) << 16) * a) / 255) & 0xff0000) +
            (a << 24)
        );
    }
}
