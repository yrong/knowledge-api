const rp = require('request-promise')
const _ = require('lodash')
const config = require('config')

const token_check_url = config.get('config.auth.base_url')+config.get('config.auth.token_check_path')
const token_name = config.get('config.auth.token_name')

module.exports = (req, res, next) => {
    let token = req.headers[token_name]
        || req.query[token_name]
        || req.cookies[token_name]
        || (req.body && req.body[token_name])
    let options = {uri:token_check_url,method:'POST',json:true,body:{token:token}}
    rp(options).then((result)=>{
        _.assign(req,result.data.passport)
        next();
    }).catch(error=>{
        next(error)
    })
};
