var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var shared = require("./webpack.shared.js");
var nodeExternals = require('webpack-node-externals');
var loaders = shared.common_loaders();
console.log("Dev Server loaders", loaders);


loaders["css"] = {
    test: /\.css$/,
    exclude: /node_modules/,
    loader: 'css-loader',
};


loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    use: ['css-loader/locals'],
};


var server = {
    name: "dev.server",
    target: "node",
    mode:"development",
    externals: [
        nodeExternals({whitelist:[/\.css/]}),
        {
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
        rules: shared.flatten_loaders(loaders)
    },
    resolve: {
        extensions: [ ".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new MiniCssExtractPlugin("[name].css")
    ]
};

module.exports = server;
