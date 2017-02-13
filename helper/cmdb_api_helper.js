var config=require('config');
var cmdb_api_config = config.get('config.cmdb');
var rp = require('request-promise');
var queryString = require('query-string');

var apiInvokeFromCmdb=function(path,callback,params){
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

module.exports = {
    apiInvokeFromCmdb:apiInvokeFromCmdb,
    getITServices:(callback,params)=>{apiInvokeFromCmdb('/api/it_services/service',callback,params)},
    getITServiceGroups:(callback)=>{apiInvokeFromCmdb('/api/it_services/group',callback)}
}