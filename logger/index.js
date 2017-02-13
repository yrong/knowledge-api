const log4js = require('log4js')
const config = require('config')
const logger_config = config.get('config.logger')
const logger = log4js.getLogger('kb-api')
logger.setLevel(logger_config.defaultLevel)
module.exports=logger


