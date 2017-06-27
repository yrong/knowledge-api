let articleHelper = require('../helper/article_helper');
let common_processor = require('./common');
let _ = require('lodash');
let dbHelper = require('../helper/db_helper')
let models = require('../models');
const Router = require('koa-router')

const Msg_ArticleNotification = 'ArticleNotification'

const article_processors = {
    findOne_processor: async (ctx) => {
        let article = await common_processor.findOne(ctx)
        let result = await articleHelper.articlesMappingWithITService([article])
        article = result[0]
        ctx.body = article
    },
    search_processor: async function(ctx) {
        let query = ctx.request.method === 'GET'?ctx.params:ctx.request.body,result
        if(query.filter)
            query.filter = dbHelper.removeEmptyFieldsInQueryFilter(query.filter)
        if(query.countBy){
            result = await articleHelper.countArticlesAndDiscussionsByITServiceGroups(query);
        }else if(query.countOnly){
            result = await articleHelper.countArticlesAndDiscussionsByITServiceKeyword(query);
        }
        else{
            result = await articleHelper.articlesSearchByITServiceKeyword(query)
        }
        ctx.body = result
    },
    tag_processor: async function(ctx) {
        let result = await dbHelper.pool.query(`select distinct(unnest(tag)) as tag from "Articles"`)
        result = result.rows.map(item => item.tag)
        ctx.body = result
    },
    findAll_processor: async function(ctx) {
        let query = ctx.request.method === 'GET'?ctx.params:ctx.request.body
        let articles = await models['Article'].findAndCountAll(dbHelper.buildQueryCondition(query));
        ctx.body = articles
    },
    post_processor: async function(ctx) {
        let obj=ctx.request.body,user_id = ctx.local.userid
        let created_obj = await models['Article'].create(obj),article_id=created_obj.uuid
        let history_obj = {article_id,user_id,action:'CREATE',new:_.omit(obj,'token')}
        await models['ArticleHistory'].create(history_obj);
        ctx.app.article_history.broadcast(Msg_ArticleNotification,history_obj)
        ctx.body = {uuid: article_id}
    },
    delete_processor: async function(ctx) {
        let user_id = ctx.local.userid
        let toDeleteRawObj = await common_processor.findOne(ctx)
        let toDeleteObj = await common_processor.findOne(ctx,false)
        await(toDeleteObj.destroy())
        let history_obj = {article_id:ctx.params.uuid,user_id,action:'DELETE',old:toDeleteRawObj}
        await models['ArticleHistory'].create(history_obj)
        ctx.app.article_history.broadcast(Msg_ArticleNotification,history_obj)
        ctx.body = {}
    },
    put_processor: async function(ctx) {
        let obj = ctx.request.body,user_id = ctx.local.userid
        let toUpdateRawObj = await common_processor.findOne(ctx)
        let toUpdateObj = await common_processor.findOne(ctx,false)
        await(toUpdateObj.update(obj))
        let updatedRawObj = await common_processor.findOne(ctx)
        let history_obj = {article_id:ctx.params.uuid,user_id,action:'UPDATE',old:toUpdateRawObj,update:_.omit(obj,'token'),new:updatedRawObj}
        await models['ArticleHistory'].create(history_obj)
        ctx.app.article_history.broadcast(Msg_ArticleNotification,history_obj)
        ctx.body = {}
    },
    timeline_search_processor: async function(ctx) {
        let query = dbHelper.buildQueryCondition(ctx.request.body)
        let results = await models['ArticleHistory'].findAll(query)
        results = await articleHelper.articlesMappingWithITService(results)
        ctx.body = results
    },
    timeline_update_processor: async function(ctx) {
        let obj = ctx.request.body
        let toUpdateObj = await models['ArticleHistory'].findOne({
            where: {
                uuid: ctx.params.uuid
            }
        })
        await(toUpdateObj.update(obj))
        ctx.body = {}
    },
    score_processor: async function(ctx){
        let user_id = ctx.local.userid
        let article_id = ctx.params.uuid
        let options = {article_id: article_id, user_id:user_id}
        let article_score = await(models['ArticleScore'].findOne({where:options}))
        if(article_score){
            await(article_score.update(ctx.request.body))
        }else{
            await(models['ArticleScore'].create(_.merge(options,{ score: ctx.request.body.score})))
        }
        ctx.body = {}
    },
    aggregate_processor: async function(ctx){
        let article_id = ctx.params.uuid
        let options = {article_id: article_id}
        let count = await(models['ArticleScore'].count({where:options}))
        let sum = await(models['ArticleScore'].sum('score',{where:options}))||0
        let result = {count:count,sum:sum,avg:(sum/count||0)}
        ctx.body = result
    }
}

const articles = new Router();

articles.post('/',article_processors.post_processor)
articles.post('/search',article_processors.search_processor)
articles.del('/:uuid',article_processors.delete_processor)
articles.get('/',article_processors.findAll_processor)
articles.get('/tag',article_processors.tag_processor)
articles.get('/:uuid',article_processors.findOne_processor)
articles.put('/:uuid',article_processors.put_processor)
articles.patch('/:uuid',article_processors.put_processor)
articles.post('/:uuid/score',article_processors.score_processor)
articles.get('/:uuid/score/aggregate',article_processors.aggregate_processor)
articles.post('/history/timeline',article_processors.timeline_search_processor)
articles.put('/history/timeline/:uuid',article_processors.timeline_update_processor)

module.exports = articles