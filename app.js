const _ = require('lodash')
const config = require('config')
const logger = require('log4js_wrapper')
/**
 * init logger
 */

logger.initialize(config.get('logger'))


const Koa = require('koa')
const convert = require('koa-convert')
const cors = require('kcors')
const Static = require('koa-static')
const mount = require('koa-mount')
const bodyParser = require('koa-bodyparser')
const responseWrapper = require('koa-response-wrapper')
const check_token = require('koa-token-checker')
const models = require('./models')
const router = require('./routes')
const cmdb_cache = require('cmdb-cache')


/**
 * init middlewares
 */

const app = new Koa();
app.use(cors({ credentials: true }))
app.use(bodyParser())
app.use(mount("/", convert(Static(__dirname + '/public'))))
app.use(responseWrapper())
app.use(check_token(config.get('auth')))
const file_uploader = require('koa-file-upload-fork')
for(let option of _.values(config.get('upload'))){
    app.use(mount(option.url,file_uploader(option).handler))
}
/**
 * init orm
 */

if(process.env.RebuildSchema){
    models.sequelize.sync({force: true}).then(function(){
        models.dbInit();
    })
}else if(process.env.upgradeSchema){
    models.sequelize.sync({force: false}).then(function(){
        models.dbInit();
    })
}


/**
 * init routes
 */
app.use(router.routes())

const IO = require( 'koa-socket' )
const notification_io = new IO(models.NotificationName)
notification_io.attach(app)

/**
 * start server
 */
app.listen(config.get('port'), () => {
    console.log('server started')
    cmdb_cache.loadAll(config.get('cmdb.base_url')+'/api')
})

