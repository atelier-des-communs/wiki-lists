var shared = require("./webpack.shared.js");
var server_loaders = shared.server_loaders;
var client_loaders = shared.client_loaders;

var client = shared.client_config(client_loaders, "dev.client");
client.mode = "development";
client.output.publicPath = "http://localhost:8081/static/";

var server = shared.server_config(server_loaders, "dev.server");
server.mode = "development";
server.output.publicPath = "http://localhost:8081/static/";

module.exports = [client, server];
