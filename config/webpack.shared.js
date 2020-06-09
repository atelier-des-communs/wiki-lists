var path = require("path");
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var nodeExternals = require('webpack-node-externals');
const { StatsWriterPlugin } = require("webpack-stats-plugin");


exports.CLIENT_BUILD_DIR = path.resolve(__dirname, "..", "dist", "client");
exports.SERVER_BUILD_DIR = path.resolve(__dirname, "..", "dist", "server");
exports.APP_DIR = path.resolve(__dirname, "..", "src");

var common_loaders = {
    js : {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
            "loader" : 'babel-loader',
            "options" :{
                "presets" : ["env", "react"]
            }
        },
    },
    ts : {
        test: /\.tsx?$/,
        use: ["ts-loader"],
    },
    /**scss:  {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]},**/
    css:  {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]},
    img : {
        test: /\.(jp[e]?g|png|gif|svg)$/i,
        loader: "file-loader?name=img/[name].[ext]?publicPath=/static"
    },
    html : {
        test: /\.html$/,
        loader: "file-loader?name=[name].[ext]"
    },
    ico : {
        test: /\.ico$/,
        loader: "file-loader?name=[name].[ext]"
    }};

// Create copies of common loaders
client_loaders = Object.assign({}, common_loaders);
server_loaders = Object.assign({}, common_loaders);

// For clients, activate chain babel loader for shrinking code (with rewrite of imports)
client_loaders.ts = {
    test: /\.tsx?$/,
    use: [
        {
            loader: "babel-loader",
            options : {
                "plugins": [[
                    "transform-imports",
                    {"lodash": {
                            "transform": "lodash/${member}",
                            "preventFullImport": true},
                        "date-fns": {
                            "transform": "date-fns/${member}",
                            "preventFullImport": true}}],
                    ["transform-semantic-ui-react-imports"],
                    ["@babel/plugin-syntax-dynamic-import"]]},
        },
        {loader:"ts-loader"}]
};

// For SSR we need different CSS loader
server_loaders["css"] = {
    test: /\.css$/,
    exclude: /node_modules/,
    loader: 'css-loader'
};

server_loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    use: ['css-loader/locals'],
};

// Client loader
client_loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    use: [MiniCssExtractPlugin.loader, 'css-loader'],
};


// Transform map to array of values
function flatten_loaders(obj) {
    return Object.keys(obj).map(key => obj[key]);
}


var langs = ["fr-FR", "en-GB"];



var mkconfig = (loaders, name) => ({
    output: {
        filename: "[name].js",
        publicPath: "/static/"
    },
    name:name,
    module: {
        rules: flatten_loaders(loaders)
    },
    resolve: {
        extensions: [".rt", ".js", ".jsx", ".ts", ".tsx"]
    },
    plugins: [
        new MiniCssExtractPlugin("[name].css"),
        //new StatsWriterPlugin({
        //    fields : null,
        //    filename: "./reports/" + name + "-stats.json"})
    ],
    node : {
        __dirname : true
    }
});

exports.server_config= (mode, name) => {
    var res = mkconfig(server_loaders, name);
    res.mode = mode;
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

exports.client_config = (mode, name) => {
    var res = mkconfig(client_loaders, name);
    res.mode = mode;
    res.target = "web";

    if (mode === "development") {
        res.devtool = 'inline-source-map';
    }

    res.entry = {"client.bundle": exports.APP_DIR + "/client"};
    // Add languages as separate entries
    for (var key of langs) {
        res.entry["lang-" + key] = exports.APP_DIR + "/server/i18n/" + key + ".ts";
    }

    res.output.path = exports.CLIENT_BUILD_DIR;
    res.output.chunkFilename = '[name].chunk.js';

    return res;
}

