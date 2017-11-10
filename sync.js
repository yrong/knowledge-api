const models = require('./models')
let sync_type = process.env['SYNC_TYPE'],force_flag=sync_type==='rebuild'?true:false
models.sequelize.sync({force: force_flag}).then(function(){
    models.dbInit().then(()=>{
        console.log('db synced')
        process.exit(0)
    })
})