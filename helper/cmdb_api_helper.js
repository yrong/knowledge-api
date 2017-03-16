var config=require('config');
var cmdb_api_config = config.get('config.cmdb');
var rp = require('request-promise');
var queryString = require('query-string');

var apiInvokeFromCmdb= function(path,params){
    var options = {
        method: 'GET',
        uri: cmdb_api_config.base_url + path + (params?('/?' + queryString.stringify(params)):''),
        json: true
    }
    return rp(options)
}

module.exports = {
    apiInvokeFromCmdb,
    getITServices:(params)=>{return apiInvokeFromCmdb('/api/it_services/service',params)},
    getITServiceGroups:()=>{return apiInvokeFromCmdb('/api/it_services/group')}
}