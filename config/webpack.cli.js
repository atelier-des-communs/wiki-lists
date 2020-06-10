var shared = require("./webpack.shared.js");

var cli = shared.server_config("development","cli");

cli.entry = {"cli" : shared.APP_DIR + "/cli"}
cli.output.path = shared.DIST_DIR;

module.exports = [cli];
