var shared = require("./webpack.shared.js");
var server_loaders = shared.common_loaders();
var client_loaders = shared.common_loaders();


server_loaders["css"] = {
    test: /\.css$/,
    exclude: /node_modules/,
    loader: 'css-loader',
};


client_loaders["css_external"] = server_loaders["css_external"] = {
    test: /\.css$/,
    include: /node_modules/,
    use: ['css-loader/locals'],
};


var client = shared.client_config(client_loaders, "dev.client");
client.mode = "development";
client.output.publicPath = "http://localhost:8081/static/";

var server = shared.server_config(server_loaders, "dev.server");
server.mode = "development";
server.output.publicPath = "http://localhost:8081/static/";

module.exports = [client, server];
