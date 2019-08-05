const models = require('sequelize-wrapper-advanced').models
const _ = require('lodash')
const common = require('scirichon-common')
const ScirichonError = common.ScirichonError
const ScirichonWarning = common.ScirichonWarning
const scirichon_cache = require('scirichon-cache')
const responseMapper = require('scirichon-response-mapper')
const config = require('config')

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
        item.category = item.category||category
        await scirichon_cache.addItem(item)
    }catch(err){
        throw new ScirichonWarning('add cache failed,' + err)
    }
}

const delFromCache = async (category,item)=>{
    try{
        item.category = item.category||category
        await scirichon_cache.delItem(_.assign({category},item))
    }catch(err){
        throw new ScirichonWarning('add cache failed,' + err)
    }
}

const userName2Id = async(name)=>{
    let user = await scirichon_cache.getItemByCategoryAndUniqueName('User',name)
    if(!_.isEmpty(user)){
        return user.uuid
    }
    return name
}

const userNames2Id = async(names)=>{
    let users=[],user
    for(let name of names){
        user = await scirichon_cache.getItemByCategoryAndUniqueName('User',name)
        if(!_.isEmpty(user)){
            users.push(user)
        }
    }
    return _.isEmpty(users)?names:_.map(users,(user)=>user.uuid)
}

const assignUserId = async(model,obj)=>{
    obj.category = model.name
    if(!_.isEmpty(obj.author)){
        obj.author = await userName2Id(obj.author)
    }
    if(!_.isEmpty(obj.from)){
        obj.from = await userName2Id(obj.from)
    }
    if(!_.isEmpty(obj.to)){
        obj.to = await userNames2Id(obj.to)
    }
    return obj
}

const setNotificationSubscriber = async (obj,notification_obj)=>{
    if(!_.isEmpty(obj.to)){
        notification_obj.subscribe_user = obj.to
        notification_obj.subscribe_role = []
    }
    return notification_obj
}

const mappingRows = async(category,rows)=>{
    let result = []
    for(let row of rows){
        row = await responseMapper.responseMapper(row,{category})
        result.push(row)
    }
    return result
}

const search_processor = async (ctx)=>{
    let model = getModelFromRoute(ctx.url);
    let query = _.assign({},ctx.params,ctx.query,ctx.request.body)
    let result = await model.findAndCountAll(common.buildQueryCondition(query)),rows=[]
    if(result&&result.rows){
        result.rows = await mappingRows(model.name,result.rows)
    }
    ctx.body = result
}

module.exports = {
    post_processor: async function(ctx) {
        let obj=ctx.request.body,user=ctx[config.get('auth.userFieldName')],
            model=getModelFromRoute(ctx.url), notification_obj,new_obj;
        obj = await assignUserId(model,obj)
        new_obj = await model.create(obj)
        new_obj = new_obj.dataValues
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'CREATE',new:new_obj,token:ctx.token,source:'kb'}
            await setNotificationSubscriber(new_obj,notification_obj)
            await addNotification(notification_obj)
        }
        if(model.cacheObj){
            await addCache(model.name,new_obj)
        }
        ctx.body = {uuid: new_obj.uuid}
    },
    delete_processor: async function(ctx) {
        let old_obj,user=ctx[config.get('auth.userFieldName')], model=getModelFromRoute(ctx.url), notification_obj;
        old_obj = await findOne(ctx,false)
        await(old_obj.destroy())
        old_obj = old_obj.dataValues
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'DELETE',old:old_obj,token:ctx.token,source:'kb'}
            await setNotificationSubscriber(old_obj,notification_obj)
            await addNotification(notification_obj)
        }
        if(model.cacheObj){
            await delFromCache(model.name,old_obj)
        }
        ctx.body = {}
    },
    put_processor: async function(ctx) {
        let update_obj=ctx.request.body,user=ctx[config.get('auth.userFieldName')],
            model=getModelFromRoute(ctx.url), notification_obj,old_obj,new_obj;
        update_obj = await assignUserId(model,update_obj)
        old_obj = await findOne(ctx)
        new_obj = await findOne(ctx,false)
        await(new_obj.update(update_obj))
        new_obj = new_obj.dataValues
        if(model.trace_history){
            notification_obj = {type:model.name,user,action:'UPDATE',old:old_obj,
                update:_.omit(update_obj,'token'),new:new_obj,token:ctx.token,source:'kb'}
            await setNotificationSubscriber(ctx,new_obj,notification_obj)
            await addNotification(notification_obj)
        }
        if(model.cacheObj){
            await addCache(model.name,new_obj)
        }
        ctx.body = {}
    },
    findOne_processor: async function(ctx) {
        let model = getModelFromRoute(ctx.url);
        let result = await findOne(ctx);
        result = await responseMapper.responseMapper(result,{category:model.name})
        ctx.body = result
    },
    findAll_processor: search_processor,
    search_processor: search_processor,
    findOne,
    addCache,
    mappingRows
}
