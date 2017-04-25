const rp = require('request-promise')
const _ = require('lodash')

module.exports = function checktoken(token_check_url,token_name) {
    return function (req, res, next) {
        let token = req.headers[token_name]
            || req.query[token_name]
            || (req.body && req.body[token_name])
            || req.cookies[token_name]
        let options = {uri:token_check_url,method:'POST',json:true,body:{token:token}}
        rp(options).then((result)=>{
            _.assign(req,result.data.passport)
            next();
        }).catch(error=>{
            res.status(401)
            next(error)
        })
    }
}