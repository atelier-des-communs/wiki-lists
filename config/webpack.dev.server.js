var ExtractTextPlugin = require("extract-text-webpack-plugin");
var shared = require("./webpack.shared.js");

var loaders = shared.flatten_loaders(shared.common_loaders)
console.log("Dev Server loaders", loaders);

var server = {
    name: "dev.server",
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
        publicPath: "http://localhost:8081/",
        libraryTarget: "commonjs2"
    },
    module: {
        rules: loaders
    },
    resolve: {
        extensions: [ ".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new ExtractTextPlugin("[name].css")
    ]
};

module.exports = server;
