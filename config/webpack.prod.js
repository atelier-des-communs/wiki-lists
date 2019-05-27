var shared = require("./webpack.shared.js");

var client = shared.client_config("production","prod.client");
var server = shared.server_config("production", "prod.server");


module.exports = [client, server];
