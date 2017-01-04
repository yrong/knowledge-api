var checkToken = require('./../handlers/checkToken');
var checkUuid = require('./../handlers/checkUuid');
var checkPatchBody = require('./../handlers/checkPatchBody');
var {article_post,article_delete,article_findAll,article_findOne,article_put} = require('../handlers/article');
const base_route = '/KB/API/v1';
var route_article = (app) => {
    app.post(`${base_route}/articles`,[checkToken],article_post);
    app.delete(`${base_route}/articles/:uuid`,[checkUuid,checkToken],article_delete);
    app.get(`${base_route}/articles`,article_findAll);
    app.get(`${base_route}/articles/:uuid`,[checkUuid],article_findOne);
    app.put(`${base_route}/articles/:uuid`,[checkUuid,checkToken],article_put);
    app.patch(`${base_route}/articles/:uuid`,[checkUuid,checkToken,checkPatchBody],article_put);
};
module.exports= {
    route_init:(app) => {
        route_article(app);
    }
};
