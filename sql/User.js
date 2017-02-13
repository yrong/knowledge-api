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
//查询用户信息
User.prototype.getUserInfo=function(userid,cb) {
    this._pool.query('SELECT userid,alias FROM users where userid=?', [userid],function(err, results, fields) {
        cb(results[0]);
    });
}
//修改用户密码
User.prototype.changepwd=function(userid,alias,oldpwd,newpwd,cb){
    var self = this;
    async.waterfall([
            function (done) {
                self._pool.query(
                    'SELECT count(*) count FROM users where userid=? and alias=? and passwd=?',
                    [userid,alias,oldpwd],
                    function(err, results, fields) {
                        if (err) {
                            done('数据库连接异常！');
                            throw err;
                        }
                        if(results)
                        {
                            if(results[0].count>=1)
                                done(null,true);
                            else
                                done('用户不存在或密码错误，无法修改密码！');
                        }
                    }
                );
            },
            function (result, done) {
                self._pool.query(
                    'update users set passwd=? where userid=?',
                    [newpwd,userid],
                    function(err, results, fields) {
                        if (err) {
                            done('数据库连接异常！');
                            throw err;
                        }
                        else
                            done(null,true);
                    }
                );

            }
        ], function (error, result) {
            if (error)
                cb({status:error});
            else
                cb({status:'ok'});
       }
			
    );
}



module.exports = User;