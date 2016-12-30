var express = require('express');
var router = express.Router();
var dbHelper = require('./../helper/db_helper');

//查询tags
router.get('/',function(req,res,next){
    dbHelper.pool.query(`select distinct(unnest(tag)) as tag from template_article`,function(err,result){
        if(err)
            res.send({status: error});
        else
            res.send({status: 'ok', data: result.rows.map(item => item.tag)});
    })
})

module.exports = router;
