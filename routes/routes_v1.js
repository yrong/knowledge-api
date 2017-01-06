var checkToken = require('./../handlers/checkToken');
var checkUuid = require('./../handlers/checkUuid');
var checkPatchBody = require('./../handlers/checkPatchBody');
var {article_post,article_delete,article_findAll,article_findOne,article_put} = require('../handlers/article');
const base_route = '/KB/API/v1';
let async = require('asyncawait/async');
let await = require('asyncawait/await');
var dbHelper = require('../helper/db_helper');

var route_article = (app) => {
    app.post(`${base_route}/articles`,[checkToken],article_post);
    app.delete(`${base_route}/articles/:uuid`,[checkUuid,checkToken],article_delete);
    app.get(`${base_route}/articles`,article_findAll);
    app.get(`${base_route}/articles/:uuid`,[checkUuid],article_findOne);
    app.put(`${base_route}/articles/:uuid`,[checkUuid,checkToken],article_put);
    app.patch(`${base_route}/articles/:uuid`,[checkUuid,checkToken,checkPatchBody],article_put);
};
var route_deleteAll = (app) => {
    app.delete(`${base_route}/synergy`,[checkToken],async(function(req, res) {
        await(dbHelper.pool.query(`delete from "Articles"`));
        await(dbHelper.pool.query(`delete from "Articles_History"`));
        res.send({status:'ok'})
    }))
}
module.exports= {
    route_init:(app) => {
        route_article(app);
        route_deleteAll(app);
    }
};
