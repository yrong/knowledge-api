let articleHelper = require('../helper/article_helper');
let common_processor = require('./common');
let _ = require('lodash');
let dbHelper = require('../helper/db_helper')
let models = require('../models');
const Router = require('koa-router')

const article_processors = {
    findOne_processor: async (ctx) => {
        let article = await common_processor.findOne(ctx)
        let result = await articleHelper.articlesMappingWithITService([article])
        article = result[0]
        ctx.body = article
    },
    search_processor: async function(ctx) {
        let query = _.assign({},ctx.params,ctx.query,ctx.request.body),result
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
        let query = _.assign({},ctx.params,ctx.query,ctx.request.body)
        let articles = await models['Article'].findAndCountAll(dbHelper.buildQueryCondition(query));
        ctx.body = articles
    },
    timeline_search_processor: async function(ctx) {
        let query = dbHelper.buildQueryCondition(ctx.request.body)
        let results = await models['ArticleHistory'].findAndCountAll(query)
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

articles.post('/',common_processor.post_processor)
articles.post('/search',article_processors.search_processor)
articles.del('/:uuid',common_processor.delete_processor)
articles.get('/',article_processors.findAll_processor)
articles.get('/tag',article_processors.tag_processor)
articles.get('/:uuid',article_processors.findOne_processor)
articles.put('/:uuid',common_processor.put_processor)
articles.patch('/:uuid',common_processor.put_processor)
articles.post('/:uuid/score',article_processors.score_processor)
articles.get('/:uuid/score/aggregate',article_processors.aggregate_processor)
articles.post('/history/timeline',article_processors.timeline_search_processor)
articles.put('/history/timeline/:uuid',article_processors.timeline_update_processor)

module.exports = articles