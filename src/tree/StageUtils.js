export default class StageUtils {

    static mergeNumbers(v1, v2, p) {
        return v1 * p + v2 * (1 - p);
    };

    static rgb(r, g, b) {
        return (r << 16) + (g << 8) + b + (255 * 16777216);
    };

    static rgba(r, g, b, a) {
        return (r << 16) + (g << 8) + b + (((a * 255) | 0) * 16777216);
    };

    static getRgbString(color) {
        let r = ((color / 65536) | 0) % 256;
        let g = ((color / 256) | 0) % 256;
        let b = color % 256;
        return 'rgb(' + r + ',' + g + ',' + b + ')';
    };

    static getRgbaString(color) {
        let r = ((color / 65536) | 0) % 256;
        let g = ((color / 256) | 0) % 256;
        let b = color % 256;
        let a = ((color / 16777216) | 0) / 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(4) + ')';
    };

    static getRgbaStringFromArray(color) {
        let r = Math.floor(color[0] * 255);
        let g = Math.floor(color[1] * 255);
        let b = Math.floor(color[2] * 255);
        let a = Math.floor(color[3] * 255) / 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a.toFixed(4) + ')';
    };

    static getRgbaComponentsNormalized(argb) {
        let r = ((argb / 65536) | 0) % 256;
        let g = ((argb / 256) | 0) % 256;
        let b = argb % 256;
        let a = ((argb / 16777216) | 0);
        return [r / 255, g / 255, b / 255, a / 255];
    };

    static getRgbComponentsNormalized(argb) {
        let r = ((argb / 65536) | 0) % 256;
        let g = ((argb / 256) | 0) % 256;
        let b = argb % 256;
        return [r / 255, g / 255, b / 255];
    };

    static getRgbaComponents(argb) {
        let r = ((argb / 65536) | 0) % 256;
        let g = ((argb / 256) | 0) % 256;
        let b = argb % 256;
        let a = ((argb / 16777216) | 0);
        return [r, g, b, a];
    };

    static getArgbNumber(rgba) {
        rgba[0] = Math.max(0, Math.min(255, rgba[0]));
        rgba[1] = Math.max(0, Math.min(255, rgba[1]));
        rgba[2] = Math.max(0, Math.min(255, rgba[2]));
        rgba[3] = Math.max(0, Math.min(255, rgba[3]));
        let v = ((rgba[3] | 0) << 24) + ((rgba[0] | 0) << 16) + ((rgba[1] | 0) << 8) + (rgba[2] | 0);
        if (v < 0) {
            v = 0xFFFFFFFF + v + 1;
        }
        return v;
    };

    static mergeColors(c1, c2, p) {
        let r1 = ((c1 / 65536) | 0) % 256;
        let g1 = ((c1 / 256) | 0) % 256;
        let b1 = c1 % 256;
        let a1 = ((c1 / 16777216) | 0);

        let r2 = ((c2 / 65536) | 0) % 256;
        let g2 = ((c2 / 256) | 0) % 256;
        let b2 = c2 % 256;
        let a2 = ((c2 / 16777216) | 0);

        let r = r1 * p + r2 * (1 - p);
        let g = g1 * p + g2 * (1 - p);
        let b = b1 * p + b2 * (1 - p);
        let a = a1 * p + a2 * (1 - p);

        return Math.round(a) * 16777216 + Math.round(r) * 65536 + Math.round(g) * 256 + Math.round(b);
    };

    static mergeMultiColors(c, p) {
        let r = 0, g = 0, b = 0, a = 0, t = 0;
        let n = c.length;
        for (let i = 0; i < n; i++) {
            let r1 = ((c[i] / 65536) | 0) % 256;
            let g1 = ((c[i] / 256) | 0) % 256;
            let b1 = c[i] % 256;
            let a1 = ((c[i] / 16777216) | 0);
            r += r1 * p[i];
            g += g1 * p[i];
            b += b1 * p[i];
            a += a1 * p[i];
            t += p[i];
        }

        t = 1 / t;
        return Math.round(a * t) * 16777216 + Math.round(r * t) * 65536 + Math.round(g * t) * 256 + Math.round(b * t);
    };

    static mergeMultiColorsEqual(c) {
        let r = 0, g = 0, b = 0, a = 0, t = 0;
        let n = c.length;
        for (let i = 0; i < n; i++) {
            let r1 = ((c[i] / 65536) | 0) % 256;
            let g1 = ((c[i] / 256) | 0) % 256;
            let b1 = c[i] % 256;
            let a1 = ((c[i] / 16777216) | 0);
            r += r1;
            g += g1;
            b += b1;
            a += a1;
            t += 1.0;
        }

        t = 1 / t;
        return Math.round(a * t) * 16777216 + Math.round(r * t) * 65536 + Math.round(g * t) * 256 + Math.round(b * t);
    };

    static mergeColorAlpha(c, alpha) {
        let a = ((c / 16777216 | 0) * alpha) | 0;
        return (((((c >> 16) & 0xff) * a) / 255) & 0xff) +
            ((((c & 0xff00) * a) / 255) & 0xff00) +
            (((((c & 0xff) << 16) * a) / 255) & 0xff0000) +
            (a << 24);
    };


}