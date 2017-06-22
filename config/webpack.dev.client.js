var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var shared = require("./webpack.shared.js");

// console.log(ExtractTextPlugin.extract({
//     fallback: 'style-loader',
//     use: 'css-loader?modules&localIdentName=[path]-[name]_[local]-[hash:base64:5]'
// }));

var loaders = [{
    test: /\.ts[x]?$/,
    use: [
        "react-hot-loader",
        "ts-loader"
    ]
}, {
    test: /\.css$/,
    use: [
		"css-hot-loader",
        "style-loader",
		"css-loader?modules&localIdentName=[path]-[name]_[local]-[hash:base64:5]"
    ]
}, {
    test: /\.scss$/,
    use: [
		"css-hot-loader",
		"style-loader",
		"css-loader?modules&localIdentName=[path]-[name]_[local]-[hash:base64:5]",
		"sass-loader"
	]
}, {
    test: /\.(jp[e]?g|png|gif|svg)$/i,
    loader: "file-loader?name=img/[name].[ext]"
}, {
    test: /\.html$/,
    loader: "file-loader?name=[name].[ext]"
}, {
    test: /\.ico$/,
    loader: "file-loader?name=[name].[ext]"
}];

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
        extensions: [".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};

module.exports = client;
