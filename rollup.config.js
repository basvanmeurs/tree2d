import fs from "fs";
import path from "path";
import ts from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import json from "@rollup/plugin-json";
import nodeResolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'

if (!process.env.TARGET) {
    throw new Error("TARGET package must be specified via --environment flag.");
}

const masterVersion = require("./package.json").version;
const packageDir = path.resolve(`./`);
const name = path.basename(packageDir);
const resolve = p => path.resolve(packageDir, p);
const pkg = require(resolve(`package.json`));
const packageOptions = pkg.buildOptions || {};

// ensure TS checks only once for each build
let hasTSChecked = false;

const outputConfigs = {
    global: {
        file: resolve(`dist/${name}.global.js`),
        format: `iife`
    }
};

const defaultFormats = ["global"];
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(",");
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats;
const packageConfigs = process.env.PROD_ONLY
    ? []
    : packageFormats.map(format => createConfig(format, outputConfigs[format]));

if (process.env.NODE_ENV === "production") {
    packageFormats.forEach(format => {
        packageConfigs.push(createMinifiedConfig(format));
    });
}

export default packageConfigs;

function createConfig(format, output, plugins = []) {
    if (!output) {
        console.log(require("chalk").yellow(`invalid format: "${format}"`));
        process.exit(1);
    }

    output.sourcemap = !!process.env.SOURCE_MAP;
    output.externalLiveBindings = false;

    const isProductionBuild = process.env.__DEV__ === "false" || /\.prod\.js$/.test(output.file);

    const shouldEmitDeclarations = process.env.TYPES != null && !hasTSChecked;

    output.name = packageOptions.name;

    const tsPlugin = ts({
        check: process.env.NODE_ENV === "production" && !hasTSChecked,
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
        cacheRoot: path.resolve(__dirname, "node_modules/.rts2_cache"),
        tsconfigOverride: {
            compilerOptions: {
                sourceMap: output.sourcemap,
                declaration: shouldEmitDeclarations,
                declarationMap: shouldEmitDeclarations
            },
            exclude: ["**/__tests__", "test-dts"]
        }
    });
    // we only need to check TS and generate declarations once for each build.
    // it also seems to run into weird issues when checking multiple times
    // during a single build.
    hasTSChecked = true;

    const entryFile = `src/index.ts`;

    return {
        input: resolve(entryFile),
        plugins: [
            nodeResolve(),
            commonJS({
                include: 'node_modules/**'
            }),
            json({
                namedExports: false
            }),
            tsPlugin,
            createReplacePlugin(isProductionBuild),
            ...plugins
        ],
        output,
        onwarn: (msg, warn) => {
            if (!/Circular/.test(msg)) {
                warn(msg);
            }
        }
    };
}

function createReplacePlugin(isProduction) {
    const replacements = {
        __COMMIT__: `"${process.env.COMMIT}"`,
        __VERSION__: `"${masterVersion}"`,
        __DEV__: !isProduction
    };

    // allow inline overrides like
    //__RUNTIME_COMPILE__=true yarn build runtime-core
    Object.keys(replacements).forEach(key => {
        if (key in process.env) {
            replacements[key] = process.env[key];
        }
    });
    return replace(replacements);
}

function createProductionConfig(format) {
    return createConfig(format, {
        file: resolve(`dist/${name}.${format}.prod.js`),
        format: outputConfigs[format].format
    });
}

function createMinifiedConfig(format) {
    const { terser } = require("rollup-plugin-terser");
    return createConfig(
        format,
        {
            file: resolve(`dist/${name}.${format}.prod.js`),
            format: outputConfigs[format].format
        },
        [
            terser({
                module: /^esm/.test(format),
                compress: {
                    ecma: 2015,
                    pure_getters: true
                }
            })
        ]
    );
}
