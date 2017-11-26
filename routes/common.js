const models = require('sequelize-wrapper-advanced').models
const _ = require('lodash')
const common = require('scirichon-common')
const config = require('config')
const ScirichonError = common.ScirichonError
const ScirichonWarning = common.ScirichonWarning

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
        common.apiInvoker('POST',`http://${config.get('privateIP')||'localhost'}:${config.get('notifier.port')}/api/notifications`,'','',notification)
    }catch(err){
        throw new ScirichonWarning('add notification failed,' + String(err))
    }
}

module.exports = {
    post_processor: async function(ctx) {
        let obj=ctx.request.body,user=ctx[common.TokenUserName],
            model=getModelFromRoute(ctx.url), notification_obj,new_obj;
        new_obj = await model.create(obj);
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'CREATE',new:new_obj,token:ctx.token,source:'kb'}
            await addNotification(notification_obj)
        }
        ctx.body = {uuid: new_obj.uuid}
    },
    delete_processor: async function(ctx) {
        let obj,user=ctx[common.TokenUserName], model=getModelFromRoute(ctx.url), notification_obj;
        obj = await findOne(ctx,false)
        await(obj.destroy())
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'DELETE',old:obj,token:ctx.token,source:'kb'}
            await addNotification(notification_obj)
        }
        ctx.body = {}
    },
    put_processor: async function(ctx) {
        let obj=ctx.request.body,user=ctx[common.TokenUserName],
            model=getModelFromRoute(ctx.url), notification_obj,old_obj,update_obj;
        old_obj = await findOne(ctx)
        update_obj = await findOne(ctx,false)
        await(update_obj.update(obj))
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'UPDATE',old:old_obj,
                update:_.omit(obj,'token'),new:update_obj,token:ctx.token,source:'kb'}
            await addNotification(notification_obj)
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
    findOne
}