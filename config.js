// console.log('loading config...');
const path = __dirname + "/";

exports.jsonConfig = function () {
    const jsonConfig = {
        "path": path, 
        "pathModels": path + "models",
        "pathDBconnetion": path + "db/connection",
        "pathLogger": path + "loggerConfig.js",
    };
    return jsonConfig;
};
