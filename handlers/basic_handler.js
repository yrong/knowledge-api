let uuid=require('node-uuid');
let {asyncRequest} = require('../helper/asyncRequest');
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let models = require('../models');
let _ = require('lodash');
let dbHelper = require('../helper/db_helper');

const getModelFromRoute = (url)=>{
    return models[_.find(Object.keys(models),((model) => url.includes(model.toLowerCase())))];
}

const findOne = (req)=>{
    let model = getModelFromRoute(req.url);
    let obj = await (model.findOne({
        where: {
            uuid: req.params.uuid
        },
        raw: true
    }));
    if(!obj){
        throw new Error(res.__('UUIDNotExistError'));
    }
    return obj;
};

const BasicHandler = {
    post_processor: asyncRequest(async(function(req, res, next) {
        let obj=req.body;
        obj.uuid = uuid.v4();
        let model = getModelFromRoute(req.url);
        obj = await(model.create(obj));
        res.send({status:'ok',uuid: obj.uuid});
    })),
    delete_processor: asyncRequest(async(function(req, res, next) {
        let model = getModelFromRoute(req.url);
        await(model.destroy({
            where: {
                uuid: req.params.uuid
            }
        }));
        res.send({status:'ok'})
    })),
    findOne_processor: asyncRequest(async (function(req, res, next) {
        res.send({status: 'ok',data:findOne(req)});
    })),
    findAll_processor: asyncRequest(async (function(req, res, next) {
        let model = getModelFromRoute(req.url);
        let query = req.method === 'GET'?req.query:req.body;
        let objs = await (model.findAndCountAll(dbHelper.buildQueryCondition(query)));
        res.send(objs);
    })),
    put_processor: asyncRequest(async(function(req, res, next) {
        let model = getModelFromRoute(req.url);
        await(model.update(req.body,{
            where: {
                uuid: req.params.uuid
            }
        }));
        res.send({status:'ok'})
    })),
    findOne:findOne
}

module.exports = BasicHandler