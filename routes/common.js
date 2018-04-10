const models = require('sequelize-wrapper-advanced').models
const _ = require('lodash')
const common = require('scirichon-common')
const ScirichonError = common.ScirichonError
const ScirichonWarning = common.ScirichonWarning
const scirichon_cache = require('scirichon-cache')

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
        throw new ScirichonError(ctx.i18n.__('UUIDNotExistError'));
    }
    return obj;
};

const addNotification = async (notification)=>{
    try{
        await common.apiInvoker('POST',common.getServiceApiUrl('notifier'),'/api/notifications','',notification)
    }catch(err){
        throw new ScirichonWarning('add notification failed,' + String(err))
    }
}

const addCache = async (category,item)=>{
    try{
        await scirichon_cache.addItem(_.assign({category},item))
    }catch(err){
        throw new ScirichonWarning('add cache failed,' + String(err))
    }
}

const delFromCache = async (category,item)=>{
    try{
        await scirichon_cache.delItem(_.assign({category},item))
    }catch(err){
        throw new ScirichonWarning('add cache failed,' + String(err))
    }
}

const userName2Id = async(model,obj,notification_obj)=>{
    let userIds=[],users=[],user
    if(model.name='Discussion'&&obj.to){
        for(let username of obj.to){
            user = await scirichon_cache.getItemByCategoryAndUniqueName('User',obj.to)
            if(!_.isEmpty(user)){
                users.push(user)
            }
        }
        if(!_.isEmpty(users)){
            userIds = _.map(users,(user)=>user.uuid)
            notification_obj.subscribe_user = userIds
        }
    }
    return notification_obj
}

module.exports = {
    post_processor: async function(ctx) {
        let obj=ctx.request.body,user=ctx[common.TokenUserName],
            model=getModelFromRoute(ctx.url), notification_obj,new_obj;
        new_obj = await model.create(obj)
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'CREATE',new:new_obj,token:ctx.token,source:'kb'}
            await userName2Id(model,new_obj,notification_obj)
            await addNotification(notification_obj)
        }
        if(model.cacheObj){
            await addCache(model.name,new_obj.dataValues)
        }
        ctx.body = {uuid: new_obj.uuid}
    },
    delete_processor: async function(ctx) {
        let old_obj,user=ctx[common.TokenUserName], model=getModelFromRoute(ctx.url), notification_obj;
        old_obj = await findOne(ctx,false)
        await(old_obj.destroy())
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'DELETE',old:old_obj,token:ctx.token,source:'kb'}
            await userName2Id(model,old_obj,notification_obj)
            await addNotification(notification_obj)
        }
        if(model.cacheObj){
            await delFromCache(model.name,old_obj.dataValues)
        }
        ctx.body = {}
    },
    put_processor: async function(ctx) {
        let update_obj=ctx.request.body,user=ctx[common.TokenUserName],
            model=getModelFromRoute(ctx.url), notification_obj,old_obj,new_obj;
        old_obj = await findOne(ctx)
        new_obj = await findOne(ctx,false)
        await(new_obj.update(update_obj))
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'UPDATE',old:old_obj,
                update:_.omit(update_obj,'token'),new:new_obj,token:ctx.token,source:'kb'}
            await userName2Id(model,new_obj,notification_obj)
            await addNotification(notification_obj)
        }
        if(model.cacheObj){
            await addCache(model.name,new_obj.dataValues)
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
        let result = await model.findAndCountAll(common.buildQueryCondition(query));
        ctx.body = result
    },
    search_processor: async function(ctx) {
        let model = getModelFromRoute(ctx.url);
        let query = _.assign({},ctx.params,ctx.query,ctx.request.body)
        let result = await model.findAndCountAll(common.buildQueryCondition(query));
        ctx.body = result
    },
    findOne,
    addCache
}