const conf = require("../config").jsonConfig();
const envConfig = process.env;
const logger = require(conf.pathLogger).getHeliosBotLogger();

exports.fnConnection = function (dbCurrent) {
    try {
        logger.trace("Open BD connections...");
        if ( envConfig.DB_CURRENT === undefined || envConfig.DB_CURRENT == null  || envConfig.DB_CURRENT == "") logger.error("La base de datos", dbCurrent, " no esta configurada en el .env.databases.json");
    
        logger.trace("db actual:", dbCurrent);
    
        const sequelize = require("sequelize");
    
    
    
        const connDB = new sequelize(dbCurrent, envConfig.DB_USER, envConfig.DB_PASSWORD, {
            loggin: 0,
            host: envConfig.DB_HOST,
            port: parseInt(envConfig.DB_PORT),
            dialect: envConfig.DB_DIALECT,
            dialectOptions: {
                encrypt: 0,
                instanceName: "",
                requestTimeout: 60000 // timeout = 30 seconds
            },
            operatorsAliases: 0,
        });

        connDB.authenticate().then(() => {
            logger.info("Conexion exitosa");
        }).catch(err => {
            logger.error("Conexion fallida", err);
        });

        return connDB;

    } catch (error) {
        logger.error( error );
    }
};