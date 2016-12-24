var mysql = require('mysql');
var Config = require('../config');
var util=require('util');
var async=require('async');
var config=new Config();
var mysql_config=config.MySQL_Connection;//mysql的连接参数
var User=function(){
    this._client=mysql.createConnection({
        host:mysql_config.host,
        port:mysql_config.port,
        user:mysql_config.user,
        password:mysql_config.password
    });
}
//验证用户token
User.prototype.token_validate=function(token,cb){
    var self=this;
    this._client.connect();
    this._client.query("use " + mysql_config.database);
    this._client.query(
        util.format("SELECT id as userid FROM tokens where token='%s'",token),
        function(err, results, fields) {
            if (err) {
                cb(false);
                throw err;
            }
            if(results.length>0)
                cb(results[0].userid);
            else
                cb(undefined);
            self._client.end();
        }
    );
}
//查询用户信息
User.prototype.getUserInfo=function(userid,cb) {
    /*cb({
        userid:'5',
        alias:'测试用户'
    });
    return;*/
    var self=this;
    self._client.connect();
    self._client.query("use " + mysql_config.database);
    self._client.query('SELECT userid,alias FROM users where userid=?', [userid],function(err, results, fields) {
        cb(results[0]);
        self._client.end();
    });
}
//修改用户密码
User.prototype.changepwd=function(userid,alias,oldpwd,newpwd,cb){
    var self=this;
    self._client.connect();
    self._client.query("use " + mysql_config.database);
    async.waterfall([
            function (done) {
                self._client.query(
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
                self._client.query(
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
			self._client.end();
       }
			
    );
}



module.exports = User;