var shared = require("./webpack.shared.js");

var client = shared.client_config("development", "dev.client");
client.output.publicPath = "http://localhost:8081/static/";

var server = shared.server_config("development", "dev.server");
server.output.publicPath = "http://localhost:8081/static/";

module.exports = [client, server];
