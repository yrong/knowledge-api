var express = require('express');
var Client=require('pg').Client;
var router = express.Router();
var Config = require('../config');
var async=require('async');
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数
var Discussions = require('../modle/Discussions');
var sql_template=new SQL_Template();
//文章评论
router.post('/', function(req, res, next) {
    //获取文章类型
    var discussions=new Discussions(req.body);
    console.log(discussions);
    //字段非空判断
    if(!discussions.validate()){
        res.send({status:'存在非空字段未赋值，评论失败！'});
        return;
    }
    console.log(discussions);
    //async.waterfall([
            //function (result, done) {
                var client = new Client(pg_config);
                client.connect();
                var insert_sql = sql_template.insertDiscussions(discussions);
                let query = client.query(insert_sql.sql,insert_sql.values,function(err, result){
                    if(err)
                        res.send({status:'评论发生异常错误！'});
                    else
                        res.send({status:'ok'});
                    client.end();
                });
           // }], function (error, result) {
            //if (error)
               // res.send({status:error});
           // else
                //res.send({status:'ok'});
        //}
    //)
});


router.get('/:idcode', function(req, res, next) {
    var idcode = req.params.idcode;
    console.log(idcode);
    if (idcode == undefined) {
        res.send({status: '未指定文章uuid，查询失败！'});
        return;
    }
    let querys = req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    let wheres='idcode=$1';
    try {
        var client = new Client(pg_config);
        client.connect();
        async.parallel({
            Results:function(done){
                let sql = sql_template.querySQL(querys, 'discussions',wheres);
                console.log(sql);
                let query = client.query(sql,[idcode],function(err, result) {
                    if(err) {
                        done('查询发生错误！', null);
                        return;
                    }
                    done(null,result.rows);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from discussions where idcode=$1',[idcode],function(err, result){
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

//无条件查询，支持排序，分页
router.get('/', function(req, res, next) {
    let querys = req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    try {
        var client = new Client(pg_config);
        client.connect();
        async.parallel({
            Results:function(done){
                let sql = sql_template.querySQL(querys, 'discussions');
                let query = client.query(sql,function(err, result) {
                    if(err) {
                        done('查询发生错误！', null);
                        return;
                    }
                    done(null,result.rows);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from discussions',function(err, result){
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
