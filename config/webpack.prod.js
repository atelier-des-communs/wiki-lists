var webpack = require("webpack");
var shared = require("./webpack.shared.js");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var Visualizer = require('webpack-visualizer-plugin');
var server_loaders = shared.common_loaders();
var client_loaders = shared.common_loaders();


// For SSR we need different CSS loader
server_loaders["css"] = {
    test: /\.css$/,
    exclude: /node_modules/,
    loader: 'css-loader/locals?module&localIdentName=[name]__[local]___[hash:base64:5]'
};

// Server build needs a loader to handle external .css files
server_loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    loader: 'css-loader/locals'
};

// Server build needs a loader to handle external .css files
client_loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    use: [MiniCssExtractPlugin.loader, 'css-loader'],
};

console.log("client loaders", client_loaders)
console.log("server loaders", server_loaders)

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
        rules: shared.flatten_loaders(client_loaders)
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new Visualizer(),
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("production")
            }
        }),
        new webpack.optimize.AggressiveMergingPlugin(),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle:true,
            compress: {
                warnings: false, // Suppress uglification warnings
                pure_getters: true,
                unsafe: true,
                unsafe_comps: true,
                screw_ie8: true,
                conditionals: true,
                unused: true,
                comparisons: true,
                sequences: true,
                dead_code: true,
                evaluate: true,
                if_return: true,
                join_vars: true
            },
            output: {
                comments: false,
            },
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
        rules: shared.flatten_loaders(server_loaders)
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
