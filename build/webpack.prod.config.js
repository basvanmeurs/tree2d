const merge = require("webpack-merge");
const { config: baseWebpackConfig, happyThreadPool } = require("./webpack.base.config");

// Helpers
const resolve = (file) => require("path").resolve(__dirname, file);

// Externals
const vueExternals = {};

module.exports = merge(baseWebpackConfig, {
    entry: {
        app: "./src/index.ts",
    },
    output: {
        path: resolve("../dist"),
        publicPath: "/dist/",
        library: "tree2d",
        libraryTarget: "umd",
        libraryExport: "default",
        // See https://github.com/webpack/webpack/issues/6522
        globalObject: "typeof self !== 'undefined' ? self : this",
    },
    module: {
        rules: [
            {
                test: /\.[jt]s$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
});
