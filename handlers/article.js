let articleHelper = require('./../helper/article_helper');
let BasicHandler = require('./basic_handler');
let _ = require('lodash');
let responseSender = require('../helper/responseSender');
let dbHelper = require('../helper/db_helper')
let models = require('../models');

module.exports = {
    findOne_processor: async (req, res, next) => {
        let article = await BasicHandler.findOne(req)
        articleHelper.articlesMappingWithITService({result: [article]}, function (err, results) {
            if (err) {
                next(err);
            } else {
                responseSender(req,res,results.result[0])
            }
        })
    },
    search_processor: function(req, res) {
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
        if(querys.filter)
            querys.filter = dbHelper.removeEmptyFieldsInQueryFilter(querys.filter)
        if(querys.countBy){
            articleHelper.countArticlesAndDiscussionsByITServiceGroups(querys);
        }else if(querys.countOnly){
            articleHelper.countArticlesAndDiscussionsByITServiceKeyword(querys);
        }
        else{
            articleHelper.articlesSearchByITServiceKeyword(querys);
        }
    },
    tag_processor: async function(req,res) {
        let result = await dbHelper.pool.query(`select distinct(unnest(tag)) as tag from "Articles"`)
        responseSender(req,res,result.rows.map(item => item.tag))
    },
    findAll_processor: async function(req, res) {
        let query = req.method === 'GET'?req.query:req.body;
        let articles = await models['Article'].findAndCountAll(dbHelper.buildQueryCondition(query));
        for(let article of articles.rows){
            article.discussion_count = await models['Discussion'].count({where:{article_id:article.uuid}})
        }
        responseSender(req,res,articles)
    }
}