let uuid=require('node-uuid');
let models = require('../models');
let _ = require('lodash');
let dbHelper = require('../helper/db_helper');
let responseSender = require('../helper/responseSender');

const getModelFromRoute = (url)=>{
    return models[_.find(Object.keys(models),((model) => url.includes(model.toLowerCase())))];
}

const findOne = async (req,raw=true)=>{
    let model = getModelFromRoute(req.url);
    let obj = await (model.findOne({
        where: {
            uuid: req.params.uuid
        },
        raw: raw
    }));
    if(!obj){
        throw new Error('UUIDNotExistError');
    }
    return obj;
};

const BasicHandler = {
    post_processor: async function(req, res, next) {
        let obj=req.body;
        let model = getModelFromRoute(req.url);
        obj = await model.create(obj);
        responseSender(req,res,{uuid: obj.uuid})
    },
    delete_processor: async function(req, res, next) {
        let obj = await findOne(req,false);
        await(obj.destroy())
        responseSender(req,res)
    },
    findOne_processor: async function(req, res, next) {
        let result = await findOne(req);
        responseSender(req,res,result);
    },
    findAll_processor: async function(req, res, next) {
        let model = getModelFromRoute(req.url);
        let query = req.method === 'GET'?req.query:req.body;
        let objs = await model.findAndCountAll(dbHelper.buildQueryCondition(query));
        responseSender(req,res,objs)
    },
    search_processor: async function(req, res, next) {
        let model = getModelFromRoute(req.url);
        let query = req.method === 'GET'?req.query:req.body;
        let objs = await model.findAndCountAll(dbHelper.buildQueryCondition(query));
        responseSender(req,res,objs)
    },
    put_processor: async function(req, res, next) {
        let obj = await findOne(req,false);
        await(obj.update(req.body));
        responseSender(req,res)
    },
    findOne:findOne
}

module.exports = BasicHandler