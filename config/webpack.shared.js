var path = require("path");
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var nodeExternals = require('webpack-node-externals');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


exports.CLIENT_BUILD_DIR = path.resolve(__dirname, "..", "dist", "client");
exports.SERVER_BUILD_DIR = path.resolve(__dirname, "..", "dist", "server");
exports.APP_DIR = path.resolve(__dirname, "..", "src");

var common_loaders = {
    "js" : {
        test: /\.(jsx)$/,
        exclude: /node_modules/,
        use: {
            "loader" : 'babel-loader',
            "options" :{
                "presets" : ["env", "react"]
            }
        },
    },
    "ts" : {
        test: /\.ts[x]?$/,
        use: ["ts-loader"],
    },
    "rt" : {
        test: /\.rt$/,
        use :  ["react-templates-loader?modules=commonjs"]
    },
    "css":  {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]},
    "img" : {
        test: /\.(jp[e]?g|png|gif|svg)$/i,
        loader: "file-loader?name=img/[name].[ext]?publicPath=/static"
    },
    "html" : {
        test: /\.html$/,
        loader: "file-loader?name=[name].[ext]"
    },
    "ico" : {
        test: /\.ico$/,
        loader: "file-loader?name=[name].[ext]"
    }};


function flatten_loaders(obj) {
    return Object.keys(obj).map(key => obj[key]);
}

exports.flatten_loaders = flatten_loaders;

/** Creates a copy of common loaders, safe to be updated */
exports.common_loaders = function() {
    return Object.assign({}, common_loaders);
};

var langs = ["fr-FR", "en-GB"];


var common_config = (loaders, name) => ({
    output: {
        filename: "[name].js",
        publicPath: "/static/"
    },
    name:name,
    module: {
        rules: exports.flatten_loaders(loaders)
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new MiniCssExtractPlugin("[name].css"),
        new BundleAnalyzerPlugin({
            analyzerMode:"static",
            reportFilename: name + "-report.html"})
    ],
    node : {
        __dirname : true
    }
});

exports.server_config= (loaders, name) => {
    var res = common_config(loaders, name);
    res.externals = [
        nodeExternals({whitelist:[/\.css/]}),
        {
            "react-dom/server": true
        }
    ],
    res.target = "node";
    res.entry = {
        "server.bundle": exports.APP_DIR + "/server"
    };
    res.output.libraryTarget = "commonjs2";
    res.output.path = exports.SERVER_BUILD_DIR;

    return res;
}

exports.client_config = (loaders, name) => {
    var res = common_config(loaders, name);
    res.target = "web";
    res.entry = {"client.bundle": exports.APP_DIR + "/client"};
    res.optimization = {splitChunks: {chunks: 'all'}};

    // Add languages as separate entries
    for (var key of langs) {
        res.entry["lang-" + key] = exports.APP_DIR + "/server/i18n/" + key + ".ts";
    }

    res.output.path = exports.CLIENT_BUILD_DIR;
    res.output.chunkFilename = '[name].js';

    return res;
}

