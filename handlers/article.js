let {asyncRequest} = require('../helper/asyncRequest');
let articleHelper = require('./../helper/article_helper');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let BasicHandler = require('./basic_handler');
let _ = require('lodash');

let Article_handler = {
    __proto__: BasicHandler
}

Article_handler.findOne_processor = asyncRequest(async (function(req, res, next) {
    let article = BasicHandler.findOne(req)
    articleHelper.articlesMappingWithITService({result:[article]},function(err,results){
        if (err){
            throw new Error(res.__('QueryITServiceError'));
        }else{
            res.send({status: 'ok',data:results.result[0]});
        }
    })
}));

Article_handler.search_processor = function(req, res, next) {
    var querys;
    if(req.method === 'GET'){
        querys = req.query;
    }else{
        querys = req.body;
    }
    if(req.url.includes('v1')){
        querys.v1 = true;
    }
    querys.res = res;
    querys.req = req;
    if(querys.countBy){
        articleHelper.countArticlesAndDiscussionsByITServiceGroups(querys);
    }else if(querys.countOnly){
        articleHelper.countArticlesAndDiscussionsByITServiceKeyword(querys);
    }
    else{
        articleHelper.articlesSearchByITServiceKeyword(querys);
    }
};

module.exports = Article_handler