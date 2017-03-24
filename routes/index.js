var _ = require('lodash')
var asyncRequestWrapper = require('../helper/asyncRequestWrapper');

//basic processors
var basic_handler_processor = require('../handlers/basic_handler')
var {post_processor,delete_processor,findAll_processor,search_processor,findOne_processor,put_processor} = _.mapValues(basic_handler_processor,(processor)=>asyncRequestWrapper(processor));
//article processors
var article_processor = require('../handlers/article')
article_processor = _.mapValues(article_processor,(processor)=>asyncRequestWrapper(processor))
var article_findOne_processor = article_processor.findOne_processor
    ,article_search_processor = article_processor.search_processor
    ,article_findAll_processor = article_processor.findAll_processor
    ,tag_processor = article_processor.tag_processor
//article score processors
var article_score_processor = require('../handlers/article_score');
var {score_processor,aggregate_processor} = _.mapValues(article_score_processor,(processor)=>asyncRequestWrapper(processor));

const base_route = '/KB/API/v1';
var dbHelper = require('../helper/db_helper');
var responseSender = require('../helper/responseSender');

var route_article = (app) => {
    let article_base_url = `${base_route}/articles`
    app.post(`${article_base_url}`,post_processor);
    app.delete(`${article_base_url}/:uuid`,delete_processor);
    app.get(`${article_base_url}`,article_findAll_processor);
    app.get(`${article_base_url}/tag`,tag_processor);
    app.get(`${article_base_url}/:uuid`,article_findOne_processor);
    app.put(`${article_base_url}/:uuid`,put_processor);
    app.patch(`${article_base_url}/:uuid`,put_processor);
    app.all(`${article_base_url}/search`,article_search_processor);
    app.post(`${article_base_url}/:uuid/score`,score_processor);
    app.get(`${article_base_url}/:uuid/score/aggregate`,aggregate_processor);
};

var route_discussion = (app) => {
    let discussion_base_url = `${base_route}/discussions`
    app.post(`${discussion_base_url}`,post_processor);
    app.delete(`${discussion_base_url}/:uuid`,delete_processor);
    app.get(`${discussion_base_url}/:uuid`,findOne_processor);
    app.all(`${discussion_base_url}`,findAll_processor);
    app.all(`${discussion_base_url}/search`,search_processor);
};

var route_deleteAll = (app) => {
    app.delete(`${base_route}/synergy`,async function(req, res) {
        await(dbHelper.pool.query(`delete from "Articles"`));
        await(dbHelper.pool.query(`delete from "Discussions"`));
        await(dbHelper.pool.query(`delete from "ArticleScores"`));
        responseSender(req,res)
    })
};

module.exports= {
    route_init:(app) => {
        route_article(app);
        route_discussion(app);
        route_deleteAll(app);
    }
};
