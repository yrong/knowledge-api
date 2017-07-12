const uuid=require('uuid');
const models = require('../models');
const _ = require('lodash');
const dbHelper = require('../helper/db_helper');
const articleHelper = require('../helper/article_helper');

const getModelFromRoute = (url)=>{
    let model = models[_.find(Object.keys(models),((model) => url.includes(model.toLowerCase())))];
    if(!model){
        throw new Error('can not find sequelize model from url:' + url)
    }
    return model
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

const Notification = models.NotificationName

module.exports = {
    post_processor: async function(ctx) {
        let obj=ctx.request.body,user_id = ctx.local.userid,
            model=getModelFromRoute(ctx.url), notification_obj,new_obj;
        new_obj = await model.create(obj);
        if(model.trace_history){
            notification_obj = {type:model.name,user_id,action:'CREATE',new:new_obj,avatar:ctx.local.avatar}
            await models[Notification].create(notification_obj);
            ctx.app[Notification].broadcast(Notification,notification_obj)
        }
        ctx.body = {uuid: new_obj.uuid}
    },
    delete_processor: async function(ctx) {
        let obj,user_id = ctx.local.userid, model=getModelFromRoute(ctx.url), notification_obj;
        obj = await findOne(ctx,false)
        await(obj.destroy())
        if(model.trace_history){
            notification_obj = {type:model.name,user_id,action:'DELETE',old:obj,avatar:ctx.local.avatar}
            await models[Notification].create(notification_obj)
            ctx.app[Notification].broadcast(Notification,notification_obj)
        }
        ctx.body = {}
    },
    put_processor: async function(ctx) {
        let obj=ctx.request.body,user_id = ctx.local.userid,
            model=getModelFromRoute(ctx.url), notification_obj,old_obj,update_obj;
        old_obj = await findOne(ctx)
        update_obj = await findOne(ctx,false)
        await(update_obj.update(obj))
        if(model.trace_history){
            notification_obj = {type:model.name,article_id:ctx.params.uuid,user_id,action:'UPDATE',old:old_obj,update:_.omit(obj,'token'),new:update_obj,avatar:ctx.local.avatar}
            await models[Notification].create(notification_obj)
            ctx.app[Notification].broadcast(Notification,notification_obj)
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
    findOne,
    timeline_search_processor: async function(ctx) {
        let user_id = ctx.local.userid,model=getModelFromRoute(ctx.url),query,result
        if(ctx.request.body.read == false){
            ctx.request.body.filter = _.merge(ctx.request.body.filter,{$not:{notified_user:{$contains:[user_id]}}})
        }
        query = dbHelper.buildQueryCondition(ctx.request.body)
        result = await model.findAndCountAll(query)
        result.rows = await articleHelper.articlesMapping(result.rows)
        result.rows = _.map(result.rows,(row)=>_.omit(row,['notified_user']))
        ctx.body = result
    },
    timeline_update_processor: async function(ctx) {
        let user_id = ctx.local.userid,notified_user,obj,model=getModelFromRoute(ctx.url),update_obj = ctx.request.body
        obj = await model.findOne({
            where: {
                uuid: ctx.params.uuid
            }
        })
        if(update_obj.read){
            notified_user = _.clone(obj.notified_user)||[]
            notified_user = _.uniq(_.concat(notified_user,[user_id]))
            update_obj.notified_user = notified_user
        }
        await(obj.update(update_obj))
        ctx.body = {}
    },
}