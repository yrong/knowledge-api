var checkToken = require('./../handlers/checkToken');
var checkUuid = require('./../handlers/checkUuid');
var checkPatchBody = require('./../handlers/checkPatchBody');
var basic_handler_processor = require('../handlers/basic_handler')
var asyncRequestWrapper = require('../helper/asyncRequestWrapper');
var _ = require('lodash')
var {post_processor,delete_processor,findAll_processor,search_processor,findOne_processor,put_processor} = _.mapValues(basic_handler_processor,(processor)=>asyncRequestWrapper(processor));
var article_processor = require('../handlers/article')
var article_findOne_processor = asyncRequestWrapper(article_processor.findOne_processor);
var article_search_processor = article_processor.search_processor;
var article_findAll_processor = asyncRequestWrapper(article_processor.findAll_processor);
var tag_processor = asyncRequestWrapper(article_processor.tag_processor);
var article_score_processor = require('../handlers/article_score');
var {score_processor,aggregate_processor} = _.mapValues(article_score_processor,(processor)=>asyncRequestWrapper(processor));
const base_route = '/KB/API/v1';
var dbHelper = require('../helper/db_helper');
var users = require('../routes/users')
var responseSender = require('../helper/responseSender');

var route_article = (app) => {
    app.post(`${base_route}/articles`,[checkToken],post_processor);
    app.delete(`${base_route}/articles/:uuid`,[checkUuid,checkToken],delete_processor);
    app.get(`${base_route}/articles`,article_findAll_processor);
    app.get(`${base_route}/articles/tag`,tag_processor);
    app.get(`${base_route}/articles/:uuid`,[checkUuid],article_findOne_processor);
    app.put(`${base_route}/articles/:uuid`,[checkUuid,checkToken],put_processor);
    app.patch(`${base_route}/articles/:uuid`,[checkUuid,checkToken],put_processor);
    app.all(`${base_route}/articles/search`,article_search_processor);
    app.post(`${base_route}/articles/:uuid/score`,[checkToken],score_processor);
    app.get(`${base_route}/articles/:uuid/score/aggregate`,aggregate_processor);
};

var route_discussion = (app) => {
    app.post(`${base_route}/discussions`,[checkToken],post_processor);
    app.delete(`${base_route}/discussions/:uuid`,[checkUuid,checkToken],delete_processor);
    app.get(`${base_route}/discussions/:uuid`,[checkUuid],findOne_processor);
    app.all(`${base_route}/discussions`,findAll_processor);
    app.all(`${base_route}/discussions/search`,search_processor);
};

var route_deleteAll = (app) => {
    app.delete(`${base_route}/synergy`,[checkToken],async function(req, res) {
        await(dbHelper.pool.query(`delete from "Articles"`));
        await(dbHelper.pool.query(`delete from "Discussions"`));
        await(dbHelper.pool.query(`delete from "ArticleScores"`));
        responseSender(req,res)
    })
};

var route_users = (app) => {
    app.use(`${base_route}/users`, users);
}

module.exports= {
    route_init:(app) => {
        route_article(app);
        route_discussion(app);
        route_users(app);
        route_deleteAll(app);
    }
};
