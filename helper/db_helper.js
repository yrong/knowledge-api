var Pool = require('pg').Pool;
var Config = require('../config');
var pg_config=new Config().PG_Connection;//pg的连接参数
var pool = new Pool(pg_config);
var _ = require('lodash');
const maxrows = 100;

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
    {
        article_table_name: 'template_article', article_table_alias: 'ta',
        discussion_table_name: 'discussions', discussion_table_alias: 't',
        notification_table_name: 'notifications',
        article_v1_table_name: 'Articles', discussion_v1_table_name: 'Discussions'
    });


const fullTextOperatorProcessor = function(val) {
    if(_.isArray(val)){
        val = _.map(val, function(val) {
            return fullTextOperatorProcessor(val);
        });
    }else{
        for(prop in val) {
            if (prop === '$fulltext'){
                if(_.isString(val[prop]))
                    val[prop] = {$raw:`plainto_tsquery('knowledge_zhcfg','${val[prop]}')`};
            }
            else if (typeof val[prop] === 'object')
                fullTextOperatorProcessor(val[prop]);
        }
    }
    return val;
};

module.exports.fullTextOperatorProcessor = fullTextOperatorProcessor

const buildQueryCondition = (querys) =>{
    let sortby = querys.sortby?querys.sortby:'createdAt';
    let order = querys.order?querys.order:'DESC';
    let page = querys.page?querys.page:1;
    let per_page = querys.per_page?querys.per_page:maxrows;
    let offset = (parseInt(page)-1)*parseInt(per_page);
    let where = querys.filter?fullTextOperatorProcessor(querys.filter):{};
    return {where:where,order:[[sortby,order]],offset:offset,limit:per_page,raw:true};
}

module.exports.buildQueryCondition = buildQueryCondition



