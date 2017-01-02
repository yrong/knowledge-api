var checkToken = require('./../handlers/checkToken');
var checkUuid = require('./../handlers/checkUuid');
var {article_post,article_delete,article_findAll,article_findOne} = require('../handlers/article');

module.exports= {
    route_article:(app) => {
        app.post('/KB/API/v1/articles',[checkToken],article_post);
        app.delete('/KB/API/v1/articles/:uuid',[checkUuid,checkToken],article_delete);
        app.get('/KB/API/v1/articles',article_findAll);
        app.get('/KB/API/v1/articles/:uuid',article_findOne);
    }
};
