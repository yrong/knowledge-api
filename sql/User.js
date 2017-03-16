var mysql = require('mysql');
var config = require('config');
var util=require('util');
var async=require('async');
var mysql_config=config.get('config.mysql');//mysql的连接参数
var User=function(){
    this._pool  = mysql.createPool(mysql_config);
}
//验证用户token
User.prototype.token_validate=function(token,cb){
    this._pool.query(
        util.format("SELECT id as userid FROM tokens where token='%s'",token),
        function(err, results, fields) {
            if (err) {
                cb(false);
                throw err;
            }
            if(results.length>0)
                cb(results[0]);
            else
                cb(undefined);
        }
    );
}



module.exports = User;