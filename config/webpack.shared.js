var path = require("path");
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

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
        loader: "file-loader?name=img/[name].[ext]"
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



