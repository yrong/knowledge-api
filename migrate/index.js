const _ = require('lodash');
const async = require('asyncawait/async');
const await = require('asyncawait/await');
const dbHelper = require('../helper/db_helper')
const models = require('../models')

let article_migrate = async(()=>{
    let sql = `delete from "Articles" where migrate=true`
    let result = await(dbHelper.pool.query(sql))
    sql = `select * from template_article`
    result = await(dbHelper.pool.query(sql))
    for (var row of result.rows){
        let article = _.pick(row,['author','content','it_service','ref_links','tag','tasks','title'])
        article['type'] = row['article_type']
        article['uuid'] = row['idcode']
        article['createdAt'] = row['created_at']
        article['updatedAt'] = row['updated_at']
        article['migrate'] = true
        await(models['Article'].create(article))
    }
    return {articles:result.rows.length}
})

let discussion_migrate = async(()=>{
    let sql = `delete from "Discussions" where migrate=true`
    let result = await(dbHelper.pool.query(sql))
    sql = `select * from discussions`
    result = await(dbHelper.pool.query(sql))
    for (var row of result.rows){
        let discussion = _.pick(row,['content','title'])
        discussion['article_id'] = row['idcode']
        discussion['type'] = row['dis_type']
        discussion['uuid'] = row['dis_idcode']
        discussion['from'] = row['dis_from']
        discussion['to'] = row['dis_to']
        discussion['reply_id'] = row['dis_reply_idcode']
        discussion['createdAt'] = row['created_at']
        discussion['updatedAt'] = row['updated_at']
        discussion['migrate'] = true
        await(models['Discussion'].create(discussion))
    }
    return {discussions:result.rows.length}
})

let migrate= async(()=>{
    return await([article_migrate(),discussion_migrate()])
})

if (require.main === module) {
    console.time('kb-api-db-migrate')
    migrate().then((result) => {
        console.timeEnd('kb-api-db-migrate')
        console.log(JSON.stringify(result, null, '\t'))
        process.exit()
    }).catch((err) => {
        console.log(err)
        process.exit()
    })
}

module.exports = migrate

