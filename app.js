/**
 * init logger
 */

const log4js_wrapper = require('log4js-wrapper-advanced')
const config = require('config')
log4js_wrapper.initialize(Object.assign({}, config.get('logger')))
const logger = log4js_wrapper.getLogger()

/**
 * init db schema
 */
const db = require('sequelize-wrapper-advanced')
db.init(config.get('postgres-kb'))

const Koa = require('koa')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const responseWrapper = require('scirichon-response-wrapper')
const authenticator = require('scirichon-authenticator')
const scirichon_cache = require('scirichon-cache')
const locale = require('koa-locale')
const i18n = require('koa-i18n')
const router = require('./routes')
const common_handler = require('./routes/common')
const scirichon_common = require('scirichon-common')

/**
 * init middlewares
 */

const app = new Koa()
locale(app)
app.use(i18n(app, {
    locales: ['zh-CN', 'en-US'],
    directory: `${process.env['NODE_CONFIG_DIR']}/../locales`,//'./config/locales',
    modes: [
        'query',                //  optional detect querystring - `/?locale=en-US`
        'subdomain',            //  optional detect subdomain   - `zh-CN.koajs.com`
        'cookie',               //  optional detect cookie      - `Cookie: locale=zh-TW`
        'header',               //  optional detect header      - `Accept-Language: zh-CN,zh;q=0.5`
        'url',                  //  optional detect url         - `/en`
        'tld'                  //  optional detect tld(the last domain) - `koajs.cn`
    ],
    "extension":".json"
}))
app.use(cors({ credentials: true }))
app.use(bodyParser())

/**
 * scirichon middlewares
 */
const redisOption = config.get('redis')
const auth_url = scirichon_common.getServiceApiUrl('auth')
if(config.get('wrapResponse'))
    app.use(responseWrapper())
app.use(authenticator.checkToken({check_token_url:`${auth_url}/auth/check`}))
app.use(authenticator.checkAcl({redisOption}))

const loadCache = async ()=>{
    let results = await db.models['Article'].findAll()
    for(let result of results){
        if(result&&result.dataValues){
            await common_handler.addCache('Article',result.dataValues)
        }
    }
}

/**
 * init routes and start server
 */
app.use(router.routes())
scirichon_cache.initialize({redisOption,prefix:process.env['SCHEMA_TYPE']})
app.listen(config.get('kb.port'), () => {
    logger.info('App started')
    if(process.env['INIT_CACHE']){
        loadCache()
    }
})

process.on('uncaughtException', (err) => {
    logger.error(`Caught exception: ${err}`)
})


