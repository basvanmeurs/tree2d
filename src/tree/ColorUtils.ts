import { Utils } from "./Utils";

export class ColorUtils {
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
        return "rgb(" + r + "," + g + "," + b + ")";
    }

    static getRgbaString(color: number): string {
        const r = ((color / 65536) | 0) % 256;
        const g = ((color / 256) | 0) % 256;
        const b = color % 256;
        const a = ((color / 16777216) | 0) / 255;
        return "rgba(" + r + "," + g + "," + b + "," + a.toFixed(4) + ")";
    }

    static getRgbaStringFromArray(color: number[]) {
        const r = Math.floor(color[0] * 255);
        const g = Math.floor(color[1] * 255);
        const b = Math.floor(color[2] * 255);
        const a = Math.floor(color[3] * 255) / 255;
        return "rgba(" + r + "," + g + "," + b + "," + a.toFixed(4) + ")";
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

    static getArgbFromAny(color: any): number {
        if (Utils.isNumber(color)) return color;
        if (Utils.isString(color)) return ColorUtils.getArgbFromString(color);
        return 0;
    }

    static getArgbFromString(color: string): number {
        const fromColorName = this.colorNameMap[color.toLowerCase()];
        if (fromColorName !== undefined) return fromColorName;

        const fromHex = this.getArgbFromHex(color);
        if (fromHex !== undefined) return fromHex;

        const fromRgba = this.getArgbFromRgba(color);
        if (fromRgba !== undefined) return fromRgba;

        return 0xffffffff;
    }

    static getArgbFromHex(hex: string) {
        if (hex.startsWith("#")) {
            return parseInt(hex.slice(1), 16) + 255 * 16777216;
        }
    }

    private static rgbaMatcher = new RegExp(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d*))?\)/);

    static getArgbFromRgba(rgba: string) {
        const matchedRgba = this.rgbaMatcher.exec(rgba);
        if (matchedRgba === null) return undefined;

        const red = parseInt(matchedRgba[1]);
        const green = parseInt(matchedRgba[2]);
        const blue = parseInt(matchedRgba[3]);
        const alpha = parseFloat(matchedRgba[4] ?? "1.0");

        return this.rgba(red, green, blue, alpha);
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

    private static colorNameMap: { [key: string]: number } = {
        aliceblue: 0xfff0f8ff,
        antiquewhite: 0xfffaebd7,
        aqua: 0xff00ffff,
        aquamarine: 0xff7fffd4,
        azure: 0xfff0ffff,
        beige: 0xfff5f5dc,
        bisque: 0xffffe4c4,
        black: 0xff000000,
        blanchedalmond: 0xffffebcd,
        blue: 0xff0000ff,
        blueviolet: 0xff8a2be2,
        brown: 0xffa52a2a,
        burlywood: 0xffdeb887,
        cadetblue: 0xff5f9ea0,
        chartreuse: 0xff7fff00,
        chocolate: 0xffd2691e,
        coral: 0xffff7f50,
        cornflowerblue: 0xff6495ed,
        cornsilk: 0xfffff8dc,
        crimson: 0xffdc143c,
        cyan: 0xff00ffff,
        darkblue: 0xff00008b,
        darkcyan: 0xff008b8b,
        darkgoldenrod: 0xffb8860b,
        darkgray: 0xffa9a9a9,
        darkgreen: 0xff006400,
        darkkhaki: 0xffbdb76b,
        darkmagenta: 0xff8b008b,
        darkolivegreen: 0xff556b2f,
        darkorange: 0xffff8c00,
        darkorchid: 0xff9932cc,
        darkred: 0xff8b0000,
        darksalmon: 0xffe9967a,
        darkseagreen: 0xff8fbc8f,
        darkslateblue: 0xff483d8b,
        darkslategray: 0xff2f4f4f,
        darkturquoise: 0xff00ced1,
        darkviolet: 0xff9400d3,
        deeppink: 0xffff1493,
        deepskyblue: 0xff00bfff,
        dimgray: 0xff696969,
        dodgerblue: 0xff1e90ff,
        firebrick: 0xffb22222,
        floralwhite: 0xfffffaf0,
        forestgreen: 0xff228b22,
        fuchsia: 0xffff00ff,
        gainsboro: 0xffdcdcdc,
        ghostwhite: 0xfff8f8ff,
        gold: 0xffffd700,
        goldenrod: 0xffdaa520,
        gray: 0xff808080,
        green: 0xff008000,
        greenyellow: 0xffadff2f,
        honeydew: 0xfff0fff0,
        hotpink: 0xffff69b4,
        indianred: 0xffcd5c5c,
        indigo: 0xff4b0082,
        ivory: 0xfffffff0,
        khaki: 0xfff0e68c,
        lavender: 0xffe6e6fa,
        lavenderblush: 0xfffff0f5,
        lawngreen: 0xff7cfc00,
        lemonchiffon: 0xfffffacd,
        lightblue: 0xffadd8e6,
        lightcoral: 0xfff08080,
        lightcyan: 0xffe0ffff,
        lightgoldenrodyellow: 0xfffafad2,
        lightgrey: 0xffd3d3d3,
        lightgreen: 0xff90ee90,
        lightpink: 0xffffb6c1,
        lightsalmon: 0xffffa07a,
        lightseagreen: 0xff20b2aa,
        lightskyblue: 0xff87cefa,
        lightslategray: 0xff778899,
        lightsteelblue: 0xffb0c4de,
        lightyellow: 0xffffffe0,
        lime: 0xff00ff00,
        limegreen: 0xff32cd32,
        linen: 0xfffaf0e6,
        magenta: 0xffff00ff,
        maroon: 0xff800000,
        mediumaquamarine: 0xff66cdaa,
        mediumblue: 0xff0000cd,
        mediumorchid: 0xffba55d3,
        mediumpurple: 0xff9370d8,
        mediumseagreen: 0xff3cb371,
        mediumslateblue: 0xff7b68ee,
        mediumspringgreen: 0xff00fa9a,
        mediumturquoise: 0xff48d1cc,
        mediumvioletred: 0xffc71585,
        midnightblue: 0xff191970,
        mintcream: 0xfff5fffa,
        mistyrose: 0xffffe4e1,
        moccasin: 0xffffe4b5,
        navajowhite: 0xffffdead,
        navy: 0xff000080,
        oldlace: 0xfffdf5e6,
        olive: 0xff808000,
        olivedrab: 0xff6b8e23,
        orange: 0xffffa500,
        orangered: 0xffff4500,
        orchid: 0xffda70d6,
        palegoldenrod: 0xffeee8aa,
        palegreen: 0xff98fb98,
        paleturquoise: 0xffafeeee,
        palevioletred: 0xffd87093,
        papayawhip: 0xffffefd5,
        peachpuff: 0xffffdab9,
        peru: 0xffcd853f,
        pink: 0xffffc0cb,
        plum: 0xffdda0dd,
        powderblue: 0xffb0e0e6,
        purple: 0xff800080,
        red: 0xffff0000,
        rosybrown: 0xffbc8f8f,
        royalblue: 0xff4169e1,
        saddlebrown: 0xff8b4513,
        salmon: 0xfffa8072,
        sandybrown: 0xfff4a460,
        seagreen: 0xff2e8b57,
        seashell: 0xfffff5ee,
        sienna: 0xffa0522d,
        silver: 0xffc0c0c0,
        skyblue: 0xff87ceeb,
        slateblue: 0xff6a5acd,
        slategray: 0xff708090,
        snow: 0xfffffafa,
        springgreen: 0xff00ff7f,
        steelblue: 0xff4682b4,
        tan: 0xffd2b48c,
        teal: 0xff008080,
        thistle: 0xffd8bfd8,
        tomato: 0xffff6347,
        turquoise: 0xff40e0d0,
        violet: 0xffee82ee,
        wheat: 0xfff5deb3,
        white: 0xffffffff,
        whitesmoke: 0xfff5f5f5,
        yellow: 0xffffff00,
        yellowgreen: 0xff9acd32,
        darkgrey: 0xffa9a9a9,
        darkslategrey: 0xff2f4f4f,
        dimgrey: 0xff696969,
        grey: 0xff808080,
        lightgray: 0xffd3d3d3,
        lightslategrey: 0xff778899,
        slategrey: 0xff708090,
    };
}
