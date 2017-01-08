let uuid=require('node-uuid');
let {asyncRequest} = require('../helper/asyncRequest');
const maxrows = 100;
let async = require('asyncawait/async');
let await = require('asyncawait/await');
let models = require('../models');
let _ = require('lodash');

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

const fullTextOperatorProcessor = function(val) {
    if(_.isArray(val)){
        val = _.map(val, function(val) {
            return fullTextOperatorProcessor(val);
        });
    }else{
        for(prop in val) {
            if (prop === '$fulltext'){
                val[prop] = {$raw:`plainto_tsquery('knowledge_zhcfg','${val[prop]}')`};
            }
            else if (typeof val[prop] === 'object')
                fullTextOperatorProcessor(val[prop]);
        }
    }
    return val;
};

const buildQueryCondition = (querys) =>{
    let sortby = querys.sortby?querys.sortby:'createdAt';
    let order = querys.order?querys.order:'DESC';
    let page = querys.page?querys.page:1;
    let per_page = querys.per_page?querys.per_page:maxrows;
    let offset = (parseInt(page)-1)*parseInt(per_page);
    let where = querys.filter?fullTextOperatorProcessor(querys.filter):{};
    return {where:where,order:[[sortby,order]],offset:offset,limit:per_page,raw:true};
}

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
        let objs = await (model.findAndCountAll(buildQueryCondition(query)));
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