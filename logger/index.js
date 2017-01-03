var winston = require('winston');

const consoleTransport = new winston.transports.Console({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    prettyPrint: process.env.NODE_ENV !== 'production',
    colorize: process.env.NODE_ENV !== 'production',
    timestamp: process.env.NODE_ENV !== 'production',
    label: 'rest-api',
    handleExceptions: true
});

const fileTransport = new winston.transports.File({
    level: 'info',
    filename: './logs/knowledge-api.log',
    handleExceptions: true,
    json: true,
    maxsize: 5242880, //5MB
    maxFiles: 5,
    colorize: false
});

const logger = new winston.Logger({
    transports: [consoleTransport,fileTransport],
});

logger.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

exports.logger=logger;
