var mysql = require('mysql');
var Config = require('../config');
var util=require('util');
var config=new Config();
var mysql_config=config.MySQL_Connection;//mysql的连接参数
var Tokens=function(){

}
Tokens.prototype.token_validate=function(token,cb){
    var client=mysql.createConnection({
        host:mysql_config.host,
        port:mysql_config.port,
        user:mysql_config.user,
        password:mysql_config.password
    });
    client.connect();
    client.query("use " + mysql_config.database);
    client.query(
        util.format("SELECT count(*) count FROM tokens where token='%s'",token),
        function(err, results, fields) {
            if (err) {
                cb(false);
                throw err;
            }
            if(results)
            {
                console.log(results);
                if(results[0].count>=1)
                    cb(true);
                else
                    cb(false);
            }
            client.end();
        }
    );
}
module.exports = Tokens;