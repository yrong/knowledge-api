/**
 * init logger
 */
const logger = require('log4js_wrapper')
logger.initialize()

/**
 * init middlewares
 */
const config = require('config');
const Koa = require('koa')
const convert = require('koa-convert')
const cors = require('kcors')
const Static = require('koa-static')
const mount = require('koa-mount')
const bodyParser = require('koa-bodyparser')
const app = new Koa();
app.use(cors({ credentials: true }))
app.use(bodyParser())
app.use(mount("/", convert(Static(__dirname + '/public'))))
const responseWrapper = require('koa-response-wrapper')
app.use(responseWrapper())
const check_token = require('koa-token-checker')
app.use(check_token())

/**
 * init orm
 */
const dbHelper = require('./helper/db_helper')
const models = require('./models')
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
const router = require('./routes')
app.use(router.routes())

/**
 * start server
 */
app.listen(config.get('port'), () => console.log('server started'))

