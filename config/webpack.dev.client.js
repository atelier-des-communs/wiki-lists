var webpack = require("webpack");
var shared = require("./webpack.shared.js");
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Clone
var loaders = shared.common_loaders();

// loaders["ts"].use.splice(0, 0, "react-hot-loader");

// Client loader for CSS
loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    use: [MiniCssExtractPlugin.loader, 'css-loader'],
};


var client = {
    name: "dev.client",
    target: "web",
    mode:"development",
    entry: {
        "client.bundle": [
            // "webpack/hot/only-dev-server",
            // "webpack-dev-server/client?http://localhost:8081",
            shared.APP_DIR + "/client"
        ]
    },
    output: {
        filename: "[name].js",
        path: shared.CLIENT_BUILD_DIR,
        publicPath: "http://localhost:8081/"
    },
    module: {
        rules: shared.flatten_loaders(loaders)
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        // new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        }),
        new MiniCssExtractPlugin("name.css")
    ]
};

module.exports = client;
