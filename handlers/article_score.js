let _ = require('lodash');
let responseSender = require('../helper/responseSender');
let models = require('../models');

module.exports = {
    score_processor: async function(req,res,next){
        let user_id = req.userid
        let article_id = req.params.uuid
        let options = {article_id: article_id, user_id:user_id}
        let article_score = await(models['ArticleScore'].findOne({where:options}))
        if(article_score){
            await(article_score.update(req.body))
        }else{
            await(models['ArticleScore'].create(_.merge(options,{ score: req.body.score})))
        }
        responseSender(req,res)
    },
    aggregate_processor: async function(req,res,next){
        let article_id = req.params.uuid
        let options = {article_id: article_id}
        let count = await(models['ArticleScore'].count({where:options}))
        let sum = await(models['ArticleScore'].sum('score',{where:options}))||0
        responseSender(req,res,{count:count,sum:sum,avg:(sum/count||0)})
    }
}