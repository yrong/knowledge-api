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
        responseSender(req,res,articles)
    },
    post_processor: async function(req, res, next) {
        let obj=req.body,user_id = req.local.userid
        let created_obj = await models['Article'].create(obj),article_id=created_obj.uuid
        let history_obj = {article_id,user_id,action:'CREATE',new:_.omit(obj,'token')}
        await models['ArticleHistory'].create(history_obj);
        responseSender(req,res,{uuid: article_id})
    },
    delete_processor: async function(req, res, next) {
        let user_id = req.local.userid
        let toDeleteRawObj = await BasicHandler.findOne(req)
        let toDeleteObj = await BasicHandler.findOne(req,false)
        await(toDeleteObj.destroy())
        let history_obj = {article_id:req.params.uuid,user_id,action:'DELETE',old:toDeleteRawObj}
        await models['ArticleHistory'].create(history_obj)
        responseSender(req,res)
    },
    put_processor: async function(req, res, next) {
        let obj = req.body,user_id = req.local.userid
        let toUpdateRawObj = await BasicHandler.findOne(req)
        let toUpdateObj = await BasicHandler.findOne(req,false)
        await(toUpdateObj.update(obj))
        let updatedRawObj = await BasicHandler.findOne(req)
        let history_obj = {article_id:req.params.uuid,user_id,action:'UPDATE',old:toUpdateRawObj,update:_.omit(obj,'token'),new:updatedRawObj}
        await models['ArticleHistory'].create(history_obj)
        responseSender(req,res)
    },
    timeline_search_processor: async function(req, res, next) {
        query = dbHelper.buildQueryCondition(req.body)
        let results = await models['ArticleHistory'].findAll(query)
        results = await articleHelper.articlesMappingWithITService(results)
        responseSender(req,res,results)
    },
    timeline_update_processor: async function(req,res,next) {
        let obj = req.body
        let toUpdateObj = await models['ArticleHistory'].findOne({
            where: {
                uuid: req.params.uuid
            }
        })
        await(toUpdateObj.update(obj))
        responseSender(req,res)
    }
}