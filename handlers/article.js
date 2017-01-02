let {Article}  = require('../models/index');
let uuid=require('node-uuid');
let {asyncRequest} = require('../helper/asyncRequest');
let articleHelper = require('./../helper/article_helper');
const maxrows = 100;

module.exports = {
    article_post: asyncRequest.bind(null, async function(req, res) {
        let article=req.body;
        article.idcode = uuid.v4();
        article = await Article.create(article);
        res.send({status:'ok',uuid: article.idcode})
    }),
    article_delete: asyncRequest.bind(null,async function(req, res) {
        await Article.destroy({
            where: {
                idcode: req.params.uuid
            }
        });
        res.send({status:'ok'})
    }),
    article_findOne: asyncRequest.bind(null,async function(req, res) {
        let article = await Article.findOne({
            where: {
                idcode: req.params.uuid
            },
            raw: true
        });
        if(!article){
            throw new Error(res.__('UUIDNotExistError'));
        }
        articleHelper.articlesMapping({rows:[article]},function(err,results){
            if (err||results.length!=1){
                throw new Error(res.__('QueryITServiceError'));
            }else{
                res.send({status: 'ok',data:results[0]});
            }
        })
    }),
    article_findAll: asyncRequest.bind(null,async function(req, res) {
        let querys = req.query,articles;
        querys.sortby = querys.sortby?querys.sortby:'createdAt';
        querys.order = querys.order?querys.order:'DESC';
        querys.page = querys.page?querys.page:1;
        querys.per_page = querys.per_page?querys.per_page:maxrows;
        if(querys.page!=undefined&&querys.per_page!=undefined)
        articles = await Article.findAndCountAll({order:[[querys.sortby,querys.order]],offset:(parseInt(querys.page)-1)*parseInt(querys.per_page),limit:querys.per_page,raw: true});
        res.send(articles);
    })
}