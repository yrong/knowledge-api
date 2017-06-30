const uuid=require('uuid');
const models = require('../models');
const _ = require('lodash');
const dbHelper = require('../helper/db_helper');

const getModelFromRoute = (url)=>{
    return models[_.find(Object.keys(models),((model) => url.includes(model.toLowerCase())))];
}

const findOne = async (ctx,raw=true)=>{
    let model = getModelFromRoute(ctx.url);
    let obj = await (model.findOne({
        where: {
            uuid: ctx.params.uuid
        },
        raw: raw
    }));
    if(!obj){
        throw new Error('UUIDNotExistError');
    }
    return obj;
};

module.exports = {
    post_processor: async function(ctx) {
        let obj=ctx.request.body,user_id = ctx.local.userid,
            model=getModelFromRoute(ctx.url),history_model_name=`${model.name}History`,
            history_obj,new_obj;
        new_obj = await model.create(obj);
        if(model.trace_history){
            history_obj = {user_id,action:'CREATE',new:new_obj}
            await models[history_model_name].create(history_obj);
            ctx.app[history_model_name].broadcast(history_model_name,history_obj)
        }
        ctx.body = {uuid: new_obj.uuid}
    },
    delete_processor: async function(ctx) {
        let obj,user_id = ctx.local.userid, model=getModelFromRoute(ctx.url),
            history_model_name=`${model.name}History`, history_obj;
        obj = await findOne(ctx,false)
        await(obj.destroy())
        if(model.trace_history){
            history_obj = {user_id,action:'DELETE',old:obj}
            await models[history_model_name].create(history_obj)
            ctx.app[history_model_name].broadcast(history_model_name,history_obj)
        }
        ctx.body = {}
    },
    put_processor: async function(ctx) {
        let obj=ctx.request.body,user_id = ctx.local.userid,
            model=getModelFromRoute(ctx.url),history_model_name=`${model.name}History`,
            history_obj,old_obj,update_obj;
        old_obj = await findOne(ctx)
        update_obj = await findOne(ctx,false)
        await(update_obj.update(obj))
        if(model.trace_history){
            history_obj = {article_id:ctx.params.uuid,user_id,action:'UPDATE',old:old_obj,update:_.omit(obj,'token'),new:update_obj}
            await models[history_model_name].create(history_obj)
            ctx.app[history_model_name].broadcast(history_model_name,history_obj)
        }
        ctx.body = {}
    },
    findOne_processor: async function(ctx) {
        let result = await findOne(ctx);
        ctx.body = result
    },
    findAll_processor: async function(ctx) {
        let model = getModelFromRoute(ctx.url);
        let query = _.assign({},ctx.params,ctx.query,ctx.request.body);
        let result = await model.findAndCountAll(dbHelper.buildQueryCondition(query));
        ctx.body = result
    },
    search_processor: async function(ctx) {
        let model = getModelFromRoute(ctx.url);
        let query = _.assign({},ctx.params,ctx.query,ctx.request.body)
        let result = await model.findAndCountAll(dbHelper.buildQueryCondition(query));
        ctx.body = result
    },
    findOne
}