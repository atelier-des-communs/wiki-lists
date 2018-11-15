var shared = require("./webpack.shared.js");
var server_loaders = shared.common_loaders();
var client_loaders = shared.common_loaders();
var MiniCssExtractPlugin = require('mini-css-extract-plugin');


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


var client = shared.client_config(client_loaders, "dev.client");
client.mode = "development";
client.output.publicPath = "http://localhost:8081/static/";

var server = shared.server_config(server_loaders, "dev.server");
server.mode = "development";
server.output.publicPath = "http://localhost:8081/static/";

module.exports = [client, server];
