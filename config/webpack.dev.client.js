var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var shared = require("./webpack.shared.js");


var client_dev_loaders = JSON.parse(JSON.stringify(shared.common_loaders));

client_dev_loaders["ts"].use.splice(0, 0, "react-hot-loader");
client_dev_loaders["css"] = {
    test: /\.css$/,
    use: [
        "css-hot-loader",
        "style-loader",
        "css-loader?modules&localIdentName=[path]-[name]_[local]-[hash:base64:5]"
    ]
};
client_dev_loaders["scss"] = {
    test: /\.scss$/,
    use: [
        "css-hot-loader",
        "style-loader",
        "css-loader?modules&localIdentName=[path]-[name]_[local]-[hash:base64:5]",
        "sass-loader"]
};

var loaders = shared.flatten_loaders(shared.common_loaders);
console.log("Dev Server loaders", loaders);


var client = {
    name: "dev.client",
    target: "web",
    entry: {
        "client.bundle": [
            "webpack/hot/only-dev-server",
            "webpack-dev-server/client?http://localhost:8081",
            shared.APP_DIR + "/client"
        ]
    },
    output: {
        filename: "[name].js",
        path: shared.CLIENT_BUILD_DIR,
        publicPath: "http://localhost:8081/"
    },
    module: {
        rules: loaders
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ]
};

module.exports = client;
