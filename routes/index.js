const _ = require('lodash')
const dbHelper = require('../helper/db_helper');
const base_route = '/KB/API/v1';
const Router = require('koa-router')
const articles = require('./article')
const discussions = require('./discussion')
const router = new Router();
router.use(`${base_route}/articles`,  articles.routes(),articles.allowedMethods())
router.use(`${base_route}/discussions`,  discussions.routes(),discussions.allowedMethods())
if(process.env.NODE_ENV === 'development') {
    router.del(`${base_route}/hidden`, async function (ctx) {
        await(dbHelper.pool.query(`delete from "Articles"`));
        await(dbHelper.pool.query(`delete from "Discussions"`));
        await(dbHelper.pool.query(`delete from "ArticleScores"`));
        ctx.body = {}
    })
}

module.exports = router
