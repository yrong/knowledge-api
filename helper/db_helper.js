var Pool = require('pg-pool')
var config = require('config')
var pg_config=config.get('config.postgres');//pg的连接参数
var pool = new Pool(pg_config);
var _ = require('lodash');
const PageSize = config.get('config.perPageSize');
var deepEqual = require('deep-equal')
var logger = require('../logger')

module.exports.pool = pool;

var countBySql = async function(sql){
    logger.info("countBySql:"+sql)
    let result = await pool.query(sql)
    let count= parseInt(result.rows[0].count)
    return count
};
module.exports.countBySql = countBySql;

var countByTableNameAndWhere = async function(table,/*alias='t',where*/...others){
    let count = countBySql('select count(*) from ' + table + (others[1]?(' as '+ others[1]):'') + (others[0]?(' where '+ others[0]):''))
    return count
};

module.exports.countByTableNameAndWhere = countByTableNameAndWhere;

module.exports = Object.assign(module.exports,
    {
        article_table_alias: 'ta', discussion_table_alias: 't',
        article_v1_table_name: 'Articles', discussion_v1_table_name: 'Discussions'
    });

var removeEmptyFieldsInQueryFilter = function(filter) {
    let filter_processed = pruneEmpty(filter)
    while(!deepEqual(filter,filter_processed)){
        filter = filter_processed
        filter_processed = pruneEmpty(filter)
    }
    return filter;
}

var pruneEmpty = function(obj) {
    return function prune(current) {
        _.forOwn(current, function (value, key) {
            if (_.isUndefined(value) || _.isNull(value) || _.isNaN(value) ||
                (_.isString(value) && _.isEmpty(value)) ||
                (_.isObject(value) && _.isEmpty(prune(value)))) {

                delete current[key];
            }
        });
        if (_.isArray(current)) _.pull(current, undefined);
        return current;

    }(_.cloneDeep(obj));
}

module.exports.removeEmptyFieldsInQueryFilter = removeEmptyFieldsInQueryFilter

const buildQueryCondition = (querys) =>{
    let sortby = querys.sortby?querys.sortby:'createdAt';
    let order = querys.order?querys.order:'DESC';
    let page = querys.page?querys.page:1;
    let per_page = querys.per_page?querys.per_page:PageSize;
    let offset = (parseInt(page)-1)*parseInt(per_page);
    querys.filter = querys.filter?removeEmptyFieldsInQueryFilter(querys.filter):{}
    return {where:querys.filter,order:[[sortby,order]],offset:offset,limit:per_page,raw:true};
}

module.exports.buildQueryCondition = buildQueryCondition



