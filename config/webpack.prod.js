var shared = require("./webpack.shared.js");
var server_loaders = shared.server_loaders;
var client_loaders = shared.client_loaders;

var client = shared.client_config(client_loaders, "prod.client");
client.mode = "production";

var server = shared.server_config(server_loaders, "prod.server");
server.mode = "production";


module.exports = [client, server];
