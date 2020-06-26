const log4js = require('log4js');


function privateGetLevel(env) {
    switch (env) {
        case 'development':
            return 'TRACE';
            break;
        case 'test':
            return 'TRACE';
            break;
        default:
            return 'DEBUG';
            break;
    }
}


log4js.configure({
    appenders: {
        access: {
            type: "console"
        },
        app: {
            type: "console",
            layout: {
                type: 'pattern',
                pattern: '%[ [%d] [%p] %f{1}:%l -- %m %]'
            }
        },
        errorFile: {
            type: "file",
            layout: {
                type: 'pattern',
                pattern: '[%d] [%p] %f{1}:%l -- %m'
            },
            filename: "logs/out.log",
            maxLogSize: 10485760, backups: 3, compress: true   
        },
        errors: {
            type: "logLevelFilter",
            level: "ERROR",
            appender: "errorFile"
        }
    },
    categories: { 
        default: { appenders: ["app", "errors"], level: privateGetLevel(process.env.NODE_ENV) ,enableCallStack:true},
        http: { appenders: [ "access"], level: "DEBUG" } 
    }
});

log4js.getHeliosBotLogger = () => {
    return log4js.getLogger('cheese');
}



module.exports = log4js;