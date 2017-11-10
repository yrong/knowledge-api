const Pool = require('pg-pool')
const config = require('config')
const pg_config=config.get('postgres-kb');//pg的连接参数
const pool = new Pool(pg_config);
const _ = require('lodash')
const common = require('scirichon-common')

const countBySql = async function(sql){
    let result = await pool.query(sql)
    let count= parseInt(result.rows[0].count)
    return count
}

const countByTableNameAndWhere = async function(table,/*alias='t',where*/...others){
    let count = countBySql('select count(*) from ' + table + (others[1]?(' as '+ others[1]):'') + (others[0]?(' where '+ others[0]):''))
    return count
}

module.exports = {pool,countBySql,countByTableNameAndWhere}

module.exports = Object.assign(module.exports,
    {
        article_table_alias: 'ta', discussion_table_alias: 't',
        article_v1_table_name: 'Articles', discussion_v1_table_name: 'Discussions'
    });




