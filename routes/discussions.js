var express = require('express');
var Client=require('pg').Client;
var router = express.Router();
var Config = require('../config');
var async=require('async');
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数
var Discussions = require('../model/Discussions');
var sql_template=new SQL_Template();
var User=require('../sql/User');
var user = new User();
//文章评论
router.post('/', function(req, res, next) {
    //获取文章类型
    var discussions=new Discussions(req.body);
    var token=req.body.token;
    //字段非空判断
    if(!discussions.validate()){
        res.send({status:'存在非空字段未赋值，评论失败！'});
        return;
    }
    var _notifications={
        action:'新增',
        targetid:discussions.idcode,
        relationid:discussions.dis_reply_idcode
    };
    var client = new Client(pg_config);
    client.connect();
    async.waterfall([
        function (done) {
            user.token_validate(token,function(info){
                if(info===undefined){
                    done('权限验证失败，无权限更改数据！',null);
                }
                else{
                    _notifications.userid=info.userid;
                    done(null,true);
                }
            });
        },
        function (result, done) {
            var insert_sql = sql_template.insertDiscussions(discussions);
            let query = client.query(insert_sql.sql,insert_sql.values,function(err, result){
                if(err)
                    done('评论发生异常错误！',null);
                else
                    discussions.dis_idcode = insert_sql.idcode;
                    done(null,true);
            });
        },
        function(result, done){
            var insert_sql = `INSERT INTO notifications(
                userid, created_at, action, targetid,relationid)
            VALUES ($1, now(), $2, $3, $4);`
            let query = client.query(insert_sql,[
                _notifications.userid,
                _notifications.action,
                _notifications.targetid,
                _notifications.relationid
            ],function(err, result){
                if(err)
                    done('新增发生异常错误！',null);
                else
                    done(null,'ok');
            });
        }], function (error, result) {
            if (error)
                res.send({status:error});
            else
                res.send({status:'ok',uuid:discussions.dis_idcode});
            client.end();
        }
    )
});

// 所有话题：/discussions/topic
router.get('/topic', function(req, res, next) {
    let querys = req.query;
    console.log(querys)
    if(querys.sortby==undefined)
        querys.sortby='dis_reply_idcode,created_at';
    // querys.type=topic;
    wheres='dis_type=\'topic\'';

    try {
        var client = new Client(pg_config);
        client.connect();
        async.parallel({
            Results:function(done){
                let sql = sql_template.querySQL(querys, 'discussions', wheres);
                console.log(sql)
                let query = client.query(sql,function(err, result) {
                    if(err) {
                        done('查询发生错误！', null);
                        return;
                    }
                    done(null,result.rows);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from discussions where dis_type=\'topic\'',function(err, result){
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
// 某话题的所有评论：/discussions/topic/{topic_id}/reply
router.get('/topic/:topic_idcode/reply', function(req, res, next) {
    var topic_idcode = req.params.topic_idcode;
    console.log(topic_idcode)
    let querys = req.query;
    console.log(querys)
    if(querys.sortby==undefined)
        querys.sortby='dis_reply_idcode,created_at';
    // querys.type=topic;
    wheres='dis_type=\'reply\' and dis_reply_idcode=$1';

    try {
        var client = new Client(pg_config);
        client.connect();
        async.parallel({
            Results:function(done){
                let sql = sql_template.querySQL(querys, 'discussions', wheres);
                console.log(sql)
                let query = client.query(sql, [topic_idcode], function(err, result) {
                    if(err) {
                        done('查询发生错误！in results', null);
                        return;
                    }
                    done(null,result.rows);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from discussions where dis_type=\'topic\' and dis_reply_idcode=$1', [topic_idcode], function(err, result){
                    if(err){
                        done('查询发生错误！in count', null);
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


router.get('/byArticle/:idcode', function(req, res, next) {
    var idcode = req.params.idcode;
    console.log(idcode);
    if (idcode == undefined) {
        res.send({status: '未指定文章uuid，查询失败！'});
        return;
    }
    let querys = req.query;
    let sql_query_count = 'select count(*) count from discussions where idcode=$1';
    if(querys.sortby==undefined)
        querys.sortby='dis_reply_idcode,created_at';
    let wheres='idcode=$1';
    if (querys.dis_type == undefined){
        
    }else{
        wheres = wheres+' and dis_type=\''+querys.dis_type+'\'';
        sql_query_count = 'select count(*) count from discussions where idcode=$1'+' and dis_type=\''+querys.dis_type+'\'';
    }
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
                let query = client.query(sql_query_count,[idcode],function(err, result){
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

router.get('/:dis_idcode', function(req, res, next) {
    var dis_idcode = req.params.dis_idcode;
    console.log(dis_idcode);
    if (dis_idcode == undefined) {
        res.send({status: '未指定topic的dis_idcode，查询失败！'});
        return;
    }
    let querys = req.query;
    if(querys.sortby==undefined)
        querys.sortby='dis_reply_idcode,created_at';
    let wheres='dis_reply_idcode=$1';
    try {
        var client = new Client(pg_config);
        client.connect();
        async.parallel({
            Results:function(done){
                let sql = sql_template.querySQL(querys, 'discussions',wheres);
                console.log(sql);
                let query = client.query(sql,[dis_idcode],function(err, result) {
                    if(err) {
                        done('查询发生错误！', null);
                        return;
                    }
                    done(null,result.rows);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from discussions where dis_reply_idcode=$1',[dis_idcode],function(err, result){
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
//topic: ?type=topic&article_idcode={article.idcode}
//reply: ?type=reply&topic_idcode={topic_idcode}
router.get('/', function(req, res, next) {
    let querys = req.query;
    console.log(querys)
    if(querys.sortby==undefined)
        querys.sortby='dis_reply_idcode,created_at';
    if(querys.type=='topic'){
        querys.type='topic';
        if(querys.article_idcode==undefined){
            //todo: query all topics
            console.log("query all topics...")
        }else if(true)//article.idcode is valid
            console.log("article idcode is valid")   
    }else if(querys.type=='reply'){
        if(querys.topic_idcode==undefined){
            //todo: query all topics
            console.log("warning: you need specify a topic")
        }
        else if(true){
            //topic.idcode is valid 
            console.log("topic idcode is valid")
        }
    }

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
                let query = client.query('select count(*) count from discussions where dis_type=\'topic\'',function(err, result){
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
