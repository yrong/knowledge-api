let articleHelper = require('./../helper/article_helper');
let BasicHandler = require('./basic_handler');
let _ = require('lodash');
let responseSender = require('../helper/responseSender');
let dbHelper = require('../helper/db_helper')
let models = require('../models');

module.exports = {
    findOne_processor: async (req, res, next) => {
        let article = await BasicHandler.findOne(req)
        let result = await articleHelper.articlesMappingWithITService([article])
        article = result[0]
        responseSender(req,res,article)
    },
    search_processor: async function(req, res) {
        var querys,result;
        if(req.method === 'GET'){
            querys = req.query;
        }else{
            querys = req.body;
        }
        if(querys.filter)
            querys.filter = dbHelper.removeEmptyFieldsInQueryFilter(querys.filter)
        if(querys.countBy){
            result = await articleHelper.countArticlesAndDiscussionsByITServiceGroups(querys);
        }else if(querys.countOnly){
            result = await articleHelper.countArticlesAndDiscussionsByITServiceKeyword(querys);
        }
        else{
            result = await articleHelper.articlesSearchByITServiceKeyword(querys)
        }
        responseSender(req,res,result)
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