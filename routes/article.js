var express = require('express');
var router = express.Router();
var async=require('async');
var Article_Type = require('../model/Article_Type');//文章类型
var Template_Article = require('../model/Template_Article');//文章实体类型
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var User=require('../sql/User');
var user=new User();
var sql_template=new SQL_Template();
var articleHelper = require('./../helper/article_helper');
var dbHelper = require('./../helper/db_helper');

//文章新增
router.post('/', function(req, res, next) {
    //获取文章类型
    var token=req.body.token;
    var template_type=Article_Type[req.body.article_type];
    if(template_type==undefined){
        res.send({status:'操作文章类型不明确！'});
        return;
    }
    var template=new Template_Article(req.body);
    //字段非空判断
    if(!template.validate()){
        res.send({status:'存在非空字段未赋值，新增失败！'});
        return;
    }
    var _notifications={
        action:'新增'
    };
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
            var insert_sql = sql_template.insertSQL(template, dbHelper.article_table_name);
            _notifications.targetid=insert_sql.idcode;
            dbHelper.pool.query(insert_sql.sql,insert_sql.values,function(err, result){
                if(err)
                    done('新增发生异常错误！',null);
                else
                    done(null,result);
            });
        },
        function(result, done){
            var insert_sql = `INSERT INTO ${dbHelper.notification_table_name}(
                userid, created_at, action, targetid,relationid)
            VALUES ($1, now(), $2, $3, $4);`
            dbHelper.pool.query(insert_sql,[
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
                res.send({status:'ok',uuid: _notifications.targetid});
        }
    )
});
//删除全部(测试使用)
router.delete('/synergy', function(req, res, next) {
    var token=req.body.token;
    async.waterfall([
            function (done) {
                user.token_validate(token,function(info){
                    if(info===undefined)
                        done('token验证失败，无权限更改数据！',null);
                    else
                        done(null,true);
                });
            },
            function (result, done) {
                dbHelper.pool.query(`delete from ${dbHelper.article_table_name}`,function(err, result){
                    dbHelper.pool.query(`delete from ${dbHelper.discussion_table_name}`,function(err, result){
                        dbHelper.pool.query(`delete from ${dbHelper.notification_table_name}`,function(err, result){
                            done(null,'ok');
                        });
                    })
                });
            }],
        function (error, result) {
            if (error)
                res.send({status: error});
            else
                res.send({status: 'ok'});
        }
    )
});
//根据id删除
router.delete('/:idcode', function(req, res, next) {
    //获取文章类型
    var idcode=req.params.idcode;
    if(idcode==undefined){
        res.send({status:'未指定删除idcode，删除失败！'});
        return;
    }
    var token=req.body.token;
    async.waterfall([
        function (done) {
            user.token_validate(token,function(info){
                if(info===undefined)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            dbHelper.pool.query(`delete from ${dbHelper.article_table_name} where idcode=$1`, [idcode],function(err, result){
                if(err)
                    done('删除发生异常错误！',null);
                else
                    done(null,'ok');
            });
        }],
        function (error, result) {
            if (error)
                res.send({status: error});
            else
                res.send({status: 'ok'});
        }
    )
});
//根据id更新若干字段
router.put('/:idcode', function(req, res, next) {
    //获取文章类型
    var idcode=req.params.idcode;
    var token=req.body.token;
    if(idcode==undefined){
        res.send({status:'未指定更新idcode，更新失败！'});
        return;
    }
    var _notifications={
        targetid:idcode,
        action:'修改'
    };
    async.waterfall([
        function (done) {
            user.token_validate(token,function(info){
                if(info===undefined)
                    done('权限验证失败，无权限更改数据！',null);
                else{
                    _notifications.userid=info.userid;
                    done(null,true);
                }
            });
        },
        function (result, done) {
            var template_type=Article_Type[req.body.article_type];
            if (template_type == undefined) {
                done('操作文章类型不明确！', null);
                return;
            }
            var template=new Template_Article(req.body);
            var update_sql = sql_template.updateSQL(template, dbHelper.article_table_name);
            dbHelper.pool.query(update_sql, [idcode],function(err,result){
                if(err)
                    done('更新发生异常错误！',null);
                else
                    done(null,result);
            });
        },
        function(result, done){
            var insert_sql = `INSERT INTO notifications(
                userid, alias, created_at, action, targetid,relationid)
            VALUES ($1,now(), $2, $3, $4);`
            dbHelper.pool.query(insert_sql,[
                _notifications.userid,
                _notifications.action,
                _notifications.targetid,
                _notifications.relationid
            ],function(err, result){
                if(err)
                    done('更新发生异常错误！',null);
                else
                    done(null,'ok');
            });
        }], function (error, result) {
            if (error)
                res.send({status: error});
            else
                res.send({status: 'ok'});
        });
});
//根据id更新某一个字段
router.patch('/:idcode', function(req, res, next) {
    //获取文章类型
    var idcode=req.params.idcode;
    var token=req.body.token;
    if(idcode==undefined){
        res.send({status:'未指定更新idcode，更新失败！'});
        return;
    }
    var _notifications={
        targetid:idcode,
        action:'修改'
    };
    let count=0;
    for(var key in req.body){
        if(key!=='token'&&key!=='article_type')//忽视token
            count++;
    }
    if(count>1)
    {
        res.send({status:'更新字段超过多个，rest权限不够，考虑put请求，更新失败！'});
        return;
    }
    async.waterfall([
        function (done) {
            user.token_validate(token,function(info){
                if(info===undefined)
                    done('权限验证失败，无权限更改数据！',null);
                else{
                    _notifications.userid=info.userid;
                    done(null,true);
                }
            });
        },
        function (result, done) {
            var template_type=Article_Type[req.body.article_type];
            if (template_type == undefined) {
                done('操作文章类型不明确！', null);
                return;
            }
            var template=new Template_Article(req.body);
            var update_sql = sql_template.updateSQL(template, dbHelper.article_table_name);
            dbHelper.pool.query(update_sql, [idcode],function(err,result){
                if(err)
                    done('更新发生异常错误！',null);
                else
                    done(err,result);
            });
        },
        function(result, done){
            var insert_sql = `INSERT INTO ${dbHelper.notification_table_name}(
                userid, created_at, action, targetid,relationid)
            VALUES ($1, now(), $2, $3, $4);`
            dbHelper.pool.query(insert_sql,[
                _notifications.userid,
                _notifications.action,
                _notifications.targetid,
                _notifications.relationid
            ],function(err, result){
                if(err)
                    done('新增发生异常错误！',null);
                else
                    done(null,result);
            });
        }], function (error, result) {
        if (error)
            res.send({status: error});
        else
            res.send({status: 'ok'});
    });
});

//根据id查询
router.get('/:idcode', function(req, res, next) {
    var idcode = req.params.idcode;
    if (idcode == undefined) {
        res.send({status: '未指定查询idcode，查询失败！'});
        return;
    }
    let sql = util.format(`select * from ${dbHelper.article_table_name} where idcode=$1`);
    query = dbHelper.pool.query(sql, [idcode], function (err, result) {
        if (err)
            res.send({status: '查询错误！'});
        else
        {
            var row=result.rows[0];
            if(row==undefined)
                res.send({status: '未查询指定id的文章！'});
            else
            {
                articleHelper.articlesMappingWithITService(result.rows,function(err,results){
                    if (err||results.length!=1){
                        res.send({status: '查询关联服务错误！'});
                    }else{
                        res.send({status: 'ok',data:results[0]});
                    }
                })
            }
        }
    });
});

//无条件查询，支持排序，分页
router.get('/', function(req, res, next) {
    let querys = req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    async.parallel({
        Results:function(done){
            let sql = sql_template.querySQL(querys, dbHelper.article_table_name);
            dbHelper.pool.query(sql,function(err, result) {
                if(err) {
                    done('查询发生错误！', null);
                    return;
                }
                articleHelper.articlesMappingWithITService(result.rows,function(err,results){
                    if (err){
                        done('查询关联服务错误！');
                    }else{
                        done(null,results);
                    }
                })
            });
        },
        Count:function(done){
            dbHelper.countByTableNameAndWhere(dbHelper.article_table_name,function(err, result){
                if(err){
                    done('查询发生错误！', null);
                    return;
                }
                done(null,result);
            });
        }
    },function(error,result){
        if(error)
            res.send({status: error});
        else
            res.send({status: 'ok', data: result});
    });

});

module.exports = router;