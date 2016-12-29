var Config = require('../config');
var config=new Config();
var cmdb_api_config = config.CMDB_API;
var rp = require('request-promise');
var _ = require('lodash');
const queryString = require('query-string');

var apiInvokeFromCmdb = function(path,params,callback){
    var options = {
        method: 'GET',
        uri: cmdb_api_config.base_url + path + (params?('/?' + queryString.stringify(params)):''),
        json: true
    };
    return rp(options).then(function (result) {
        callback(null,result);
    }).catch(function (e){
        callback(e,null)
    });
}
module.exports.apiInvokeFromCmdb = apiInvokeFromCmdb;

var findITServiceItemByID = function(uuid,it_services){
    return _.find(it_services,function(it_service){
        return it_service.service.uuid === uuid;
    })
};

var serviceMapping = function(results,it_services){
    results = _.map(results,function(result){
        if(result.it_service){
            var it_services_items = [];
            _.each(result.it_service,function(uuid){
                it_services_items.push(findITServiceItemByID(uuid,it_services));
            });
            result.it_service = it_services_items;
        }
        return result;
    })
    return results;
};

var contentMapping = function(results){
    results = _.map(results,function(result){
        result = _.assign(result,result.content);
        result = _.omit(result,'content');
        return result;
    })
    return results;
};

var articlesMapping = function(result,callback){
    let results=[],it_service_uuids=[],it_services = [];
    for(let i=0;i<result.rows.length;i++){
        let row=result.rows[i];
        results.push(row);
        it_service_uuids = _.concat(it_service_uuids,row.it_service);
    }
    it_service_uuids = _.uniq(it_service_uuids);
    results = contentMapping(results);
    if(it_service_uuids.length){
        apiInvokeFromCmdb('/api/it_services/service',{uuids:it_service_uuids.join()},function(error,result){
            if(error){
                callback(error,results);
            }else{
                it_services = result.data;
                results = serviceMapping(results,it_services);
                callback(null,results);
            }

        })
    }else{
        callback(null,results);
    }
}
module.exports.articlesMapping = articlesMapping;

