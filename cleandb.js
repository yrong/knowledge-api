let async = require('asyncawait/async');
let await = require('asyncawait/await');
var dbHelper = require('./helper/db_helper');

let cleandb = async(()=>{
    await(dbHelper.pool.query(`DROP TABLE IF EXISTS "Articles"`));
    await(dbHelper.pool.query(`DROP TABLE IF EXISTS "Discussions"`));
    await(dbHelper.pool.query(`DROP TABLE IF EXISTS "ArticleScores"`));
})

if (require.main === module) {
    console.time('cleandb')
    cleandb().then((result) => {
        console.timeEnd('cleandb')
        process.exit()
    }).catch((err) => {
        console.log(err)
        process.exit()
    })
}

