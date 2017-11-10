const _ = require('lodash')
const config = require('config')
const Logger = require('log4js_wrapper')
/**
 * init logger
 */

Logger.initialize(config.get('logger'))
const logger = Logger.getLogger()

const Koa = require('koa')
const cors = require('kcors')
const bodyParser = require('koa-bodyparser')
const responseWrapper = require('scirichon-response-wrapper')
const check_token = require('scirichon-token-checker')
const models = require('./models')
const router = require('./routes')
const acl_checker = require('scirichon-acl-checker')
const locale = require('koa-locale')
const i18n = require('koa-i18n')
const scirichon_cache = require('scirichon-cache')

/**
 * init middlewares
 */

const app = new Koa()
locale(app)
app.use(i18n(app, {
    locales: ['zh-CN', 'en-US'],
    directory: './config/locales',
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
app.use(responseWrapper())
app.use(check_token({check_token_url:`http://${config.get('privateIP')||'localhost'}:${config.get('auth.port')}/auth/check`}))
app.use(acl_checker.middleware)

/**
 * init routes
 */
app.use(router.routes())


/**
 * start server
 */
scirichon_cache.initialize({cmdb_url: `http://${config.get('privateIP') || 'localhost'}:${config.get('cmdb.port')}/api`}).then((schemas)=>{
    if (schemas && schemas.length) {
        app.listen(config.get('kb.port'), () => {
            logger.info('App started')
        })
    }else{
        logger.fatal(`no schemas found,npm run init in cmdb first!`)
        process.exit(-2)
    }
})


