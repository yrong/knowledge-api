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

const BasicHandler = {
    post_processor: async function(ctx) {
        let obj=ctx.request.body;
        let model = getModelFromRoute(ctx.url);
        obj = await model.create(obj);
        ctx.body = {uuid: obj.uuid}
    },
    delete_processor: async function(ctx) {
        let obj = await findOne(ctx,false);
        await(obj.destroy())
        ctx.body = {}
    },
    findOne_processor: async function(ctx) {
        let result = await findOne(ctx);
        ctx.body = result
    },
    findAll_processor: async function(ctx) {
        let model = getModelFromRoute(ctx.url);
        let query = ctx.request.method === 'GET'?ctx.params:ctx.request.body;
        let result = await model.findAndCountAll(dbHelper.buildQueryCondition(query));
        ctx.body = result
    },
    search_processor: async function(ctx) {
        let model = getModelFromRoute(ctx.url);
        let query = ctx.request.method === 'GET'?ctx.params:ctx.request.body;
        let result = await model.findAndCountAll(dbHelper.buildQueryCondition(query));
        ctx.body = result
    },
    put_processor: async function(ctx) {
        let obj = await findOne(ctx,false);
        await(obj.update(ctx.request.body));
        ctx.body = {}
    },
    findOne:findOne
}

module.exports = BasicHandler