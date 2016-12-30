var Pool = require('pg').Pool;
var Config = require('../config');
var pg_config=new Config().PG_Connection;//pg的连接参数
var pool = new Pool(pg_config);

module.exports.pool = pool;

var countBySql = function(sql,callback){
    query = pool.query(sql,function(err, result){
        if(err){
            callback(err, null);
            return;
        }
        let count=parseInt(result.rows[0].count);
        callback(null,count);
    });
};
module.exports.countBySql = countBySql;

var countByTableNameAndWhere = function(table,callback,/*alias='t',where*/...others){
    countBySql('select count(*) from ' + table + (others[1]?(' as '+ others[1]):'') + (others[0]?(' where '+ others[0]):''),callback);
};

module.exports.countByTableNameAndWhere = countByTableNameAndWhere;

module.exports = Object.assign(module.exports,
    {article_table_name:'template_article',article_table_alias:'ta', discussion_table_name:'discussions',discussion_table_alias:'t',notification_table_name:'notifications'});






