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
const dbHelper = require('./helper/db_helper')
const models = require('./models')
const router = require('./routes')


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
let cleandb = async ()=>{
    await dbHelper.pool.query(`DROP TABLE IF EXISTS "Articles"`)
    await dbHelper.pool.query(`DROP TABLE IF EXISTS "Discussions"`)
    await dbHelper.pool.query(`DROP TABLE IF EXISTS "ArticleScores"`)
    await dbHelper.pool.query(`DROP TABLE IF EXISTS "ArticleHistories"`)
}
let init_orm = ()=>{
    models.sequelize.sync().then(function(){
        models.dbInit();
    })
}
if(process.env.RebuildSchema){
    cleandb().then(()=>{
        init_orm()
    })
}else{
    init_orm()
}


/**
 * init routes
 */
app.use(router.routes())

/**
 * start server
 */
app.listen(config.get('port'), () => console.log('server started'))

