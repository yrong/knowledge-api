let {asyncRequest} = require('../helper/asyncRequest');
let articleHelper = require('./../helper/article_helper');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let BasicHandler = require('./basic_handler');
let _ = require('lodash');
let responseSender = require('../helper/responseSender');
let dbHelper = require('../helper/db_helper')
let models = require('../models');

module.exports = {
    findOne_processor: asyncRequest(async((req, res, next) => {
        let article = await(BasicHandler.findOne(req))
        articleHelper.articlesMappingWithITService({result: [article]}, function (err, results) {
            if (err) {
                next(err);
            } else {
                responseSender(req,res,results.result[0])
            }
        })
    })),
    search_processor: function(req, res, next) {
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
    },
    tag_processor: function(req,res,next) {
        dbHelper.pool.query(`select distinct(unnest(tag)) as tag from "Articles"`,function(err,result){
            if(err)
                next(err)
            else
                responseSender(req,res,result.rows.map(item => item.tag))
        })
    }
}