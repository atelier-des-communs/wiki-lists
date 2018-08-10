var webpack = require("webpack");
var shared = require("./webpack.shared.js");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var loaders = shared.flatten_loaders(shared.common_loaders);

console.log("Prod loaders", loaders);


var client = {
    name: "prod.client",
    target: "web",
    entry: {
        "client.bundle": shared.APP_DIR + "/client"
    },
    output: {
        filename: "[name].js",
        path: shared.CLIENT_BUILD_DIR,
        publicPath: "/"
    },
    module: {
        rules: loaders
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                unused: true,
                dead_code: true, // big one--strip code that will never execute
                warnings: false, // good for prod apps so users can't peek behind curtain
                drop_debugger: true,
                conditionals: true,
                evaluate: true,
                drop_console: true, // strips console statements
                sequences: true,
                booleans: true,
            }
        }),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new ExtractTextPlugin("[name].css")
    ]
};

var server = {
    name: "prod.server",
    target: "node",
    externals: [
        /^[a-z\-0-9]+$/, {
            "react-dom/server": true
        }
    ],
    entry: {
        "server.bundle": shared.APP_DIR + "/server"
    },
    output: {
        filename: "[name].js",
        path: shared.SERVER_BUILD_DIR,
        publicPath: "/",
        libraryTarget: "commonjs2"
    },
    module: {
        rules: loaders
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),

        new ExtractTextPlugin("[name].css")
    ]
};

module.exports = [client, server];
