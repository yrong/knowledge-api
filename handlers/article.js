let {asyncRequest} = require('../helper/asyncRequest');
let articleHelper = require('./../helper/article_helper');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let BasicHandler = require('./basic_handler');

let Article_handler = {
    __proto__: BasicHandler
}

Article_handler.findOne_processor = asyncRequest(async (function(req, res, next) {
    let article = BasicHandler.findOne(req)
    articleHelper.articlesMappingWithITService([article],function(err,results){
        if (err||results.length!=1){
            throw new Error(res.__('QueryITServiceError'));
        }else{
            res.send({status: 'ok',data:results[0]});
        }
    })
}));

module.exports = Article_handler