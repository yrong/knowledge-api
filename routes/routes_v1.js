var checkToken = require('./../handlers/checkToken');
var checkUuid = require('./../handlers/checkUuid');
var checkPatchBody = require('./../handlers/checkPatchBody');
var {post_processor,delete_processor,findAll_processor,search_processor,findOne_processor,put_processor} = require('../handlers/basic_handler');
var article_findOne_processor = require('../handlers/article').findOne_processor;
var article_search_processor = require('../handlers/article').search_processor;
const base_route = '/KB/API/v1';
let async = require('asyncawait/async');
let await = require('asyncawait/await');
var dbHelper = require('../helper/db_helper');

var route_article = (app) => {
    app.post(`${base_route}/articles`,[checkToken],post_processor);
    app.delete(`${base_route}/articles/:uuid`,[checkUuid,checkToken],delete_processor);
    app.get(`${base_route}/articles`,findAll_processor);
    app.get(`${base_route}/articles/:uuid`,[checkUuid],article_findOne_processor);
    app.put(`${base_route}/articles/:uuid`,[checkUuid,checkToken],put_processor);
    app.patch(`${base_route}/articles/:uuid`,[checkUuid,checkToken],put_processor);
    app.all(`${base_route}/articles/search`,article_search_processor);
};

var route_discussion = (app) => {
    app.post(`${base_route}/discussions`,[checkToken],post_processor);
    app.delete(`${base_route}/discussions/:uuid`,[checkUuid,checkToken],delete_processor);
    app.get(`${base_route}/discussions/:uuid`,[checkUuid],findOne_processor);
    app.all(`${base_route}/discussions`,findAll_processor);
    app.all(`${base_route}/discussions/search`,search_processor);
};

var route_deleteAll = (app) => {
    app.delete(`${base_route}/synergy`,[checkToken],async(function(req, res) {
        await(dbHelper.pool.query(`delete from "Articles"`));
        await(dbHelper.pool.query(`delete from "Discussions"`));
        res.send({status:'ok'})
    }))
}
module.exports= {
    route_init:(app) => {
        route_article(app);
        route_discussion(app);
        route_deleteAll(app);
    }
};
