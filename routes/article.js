const articleHelper = require('../helper/article_helper');
const common_processor = require('./common');
const _ = require('lodash');
const dbHelper = require('../helper/db_helper')
const models = require('sequelize-wrapper-advanced').models
const Router = require('koa-router')
const common = require('scirichon-common')
const config = require('config')

const article_processors = {
    search_processor: async function(ctx) {
        let query = _.assign({},ctx.params,ctx.query,ctx.request.body),result
        query.filter = common.pruneEmpty(query.filter)
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
    score_processor: async function(ctx){
        let token_user = ctx[config.get('auth.userFieldName')]
        let user_id = token_user.uuid
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
articles.get('/',common_processor.findAll_processor)
articles.get('/tag',article_processors.tag_processor)
articles.get('/:uuid',common_processor.findOne_processor)
articles.put('/:uuid',common_processor.put_processor)
articles.patch('/:uuid',common_processor.put_processor)
articles.post('/:uuid/score',article_processors.score_processor)
articles.get('/:uuid/score/aggregate',article_processors.aggregate_processor)

module.exports = articles
