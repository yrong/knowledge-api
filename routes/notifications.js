var express = require('express');
var pg = require('pg');
var Client=pg.Client;
var router = express.Router();
var Config = require('../config');
var util=require('util');
var async=require('async');
var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数


router.get('/', function(req, res, next) {
    let querys = req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    try {
        var client = new Client(pg_config);
        client.connect();
        let rootsql=`select a.id,a.userid,a.created_at,a.action,a.targetid,b.title,b.article_type as type from notifications a,template_article b where a.targetid=b.idcode::text
        union all
        select a.id,a.userid,a.created_at,a.action,a.targetid,b.title,b.dis_type as type from notifications a,discussions b where a.targetid=b.dis_idcode::text`;
        async.parallel({
            Results:function(done){
                let sql=util.format('select t.* from (%s) t',rootsql);
                if(querys.page!=undefined&&querys.per_page!=undefined)
                    sql+=util.format(' limit %s offset %s',querys.per_page,(parseInt(querys.page)-1)*parseInt(querys.per_page));
                console.log(sql);
                let query = client.query(sql,function(err, result) {
                    if(err) {
                        done('查询发生错误！', null);
                        return;
                    }
                    done(null,result.rows);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from notifications',function(err, result){
                    if(err){
                        done('查询发生错误！', null);
                        return;
                    }
                    let count=parseInt(result.rows[0].count);
                    done(null,count);

                });
            }
        },function(error,result){
            if(error)
                res.send({status: error});
            else
                res.send({status: 'ok', data: result});
            client.end();
        });
    }
    catch(e) {
        console.log(e);
        res.send({status: '数据库连接错误！'});
    }
});


module.exports = router;