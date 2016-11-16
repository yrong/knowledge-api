var express = require('express');
var Client=require('pg').Client;
var router = express.Router();
var Config = require('../config');
var async=require('async');
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var Tokens=require('../sql/Tokens');
var IT_Services=require('./IT_Services');
var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数
var tokens=new Tokens();
var sql_template=new SQL_Template();
//文章更新
router.post('/', function(req, res, next) {
    //获取文章类型
    var token=req.body.token;
    var it_services=new IT_Services(req.body);
    if(!it_services.validate()){
        res.send({status:'存在非空字段未赋值，新增失败！'});
        return;
    }
    async.waterfall([
            function (done) {
                tokens.token_validate(token,function(info){
                    if(!info)
                        done('fail',null);
                    else
                        done(null,true);
                });
            },
            function (result, done) {
                var client = new Client(pg_config);
                client.connect();
                var insert_sql = sql_template.insertSQL(it_services, 'it_services');
                let query = client.query(insert_sql.sql,insert_sql.values,function(err, result){
                    console.log(err,result);
                    if(err)
                        done(err,null);
                    else
                        done(null,'ok');
                    client.end();
                });
            }], function (error, result) {
            if (error)
                res.send({status:error});
            else
                res.send({status:'ok'});
        }
    )
});
//根据id删除
router.delete('/:id', function(req, res, next) {
    //获取文章类型
    var id=req.params.id;
    if(id==undefined){
        res.send({status:'未指定删除id，删除失败！'});
        return;
    }
    var token=req.body.token;
    async.waterfall([
            function (done) {
                tokens.token_validate(token,function(info){
                    if(!info)
                        done('token验证失败，无权限更改数据！',null);
                    else
                        done(null,true);
                });
            },
            function (result, done) {
                var client = new Client(pg_config);
                client.connect();
                let query = client.query('delete from template_article where id=$1', [id],function(err, result){
                    if(err)
                        done(err,null);
                    else
                        done(null,'ok');
                    client.end();
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
router.put('/:id', function(req, res, next) {
    //获取文章类型
    var id=req.params.id;
    var token=req.body.token;
    if(id==undefined){
        res.send({status:'未指定更新id，更新失败！'});
        return;
    }
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:e});
        return;
    }
    async.waterfall([
        function (done) {
            tokens.token_validate(token,function(info){
                if(!info)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            sql = "select id,article_type from template_article where id=$1";
            let query = client.query(sql, [id], function (err, result) {
                if (err)
                    done(err, null);
                else
                    done(null, result.rows);
            });
        },
        function (rows, done) {
            if(rows.length==0) {
                done('根据id未获取更新的记录！', null);
                return;
            }
            var template_type = rows[0].article_type;
            if (template_type == undefined) {
                done('操作文章类型不明确！', null);
                return;
            }
            var template;
            //根据文章类型，返回需要的sql模板
            switch (template_type) {
                case Article_Type.Free:
                    template = new Template_Free(req.body);
                    break;
                case Article_Type.Guide:
                    template = new Template_Guide(req.body);
                    break;
                case Article_Type.Troubleshooting:
                    template = new Template_Troubleshooting(req.body);
                    break;
            }
            var update_sql = sql_template.updateSQL(template, template_type);
            let query = client.query(update_sql, [id],function(err,result){
                if(err)
                    done(err,null);
                else
                    done(err,'ok');
            });
        }], function (error, result) {
        if (error)
            res.send({status: error});
        else
            res.send({status: 'ok'});
        client.end();
    });
});
//根据id更新某一个字段
router.patch('/:id', function(req, res, next) {
    //获取文章类型
    var id=req.params.id;
    var token=req.body.token;
    if(id==undefined){
        res.send({status:'未指定更新id，更新失败！'});
        return;
    }
    let count=0;
    for(var key in req.body){
        if(key!=='token')//忽视token
            count++;
    }
    if(count>1)
    {
        res.send({status:'更新字段超过多个，rest权限不够，考虑put请求，更新失败！'});
        return;
    }
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:e});
        return;
    }
    async.waterfall([
        function (done) {
            tokens.token_validate(token,function(info){
                if(!info)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            sql = "select id,article_type from template_article where id=$1";
            let query = client.query(sql, [id], function (err, result) {
                if (err)
                    done(err, null);
                else
                    done(null, result.rows);
            });
        },
        function (rows, done) {
            if(rows.length==0) {
                done('根据id未获取更新的记录！', null);
                return;
            }
            var template_type = rows[0].article_type;
            if (template_type == undefined) {
                done('操作文章类型不明确！', null);
                return;
            }
            var template;
            //根据文章类型，返回需要的sql模板
            switch (template_type) {
                case Article_Type.Free:
                    template = new Template_Free(req.body);
                    break;
                case Article_Type.Guide:
                    template = new Template_Guide(req.body);
                    break;
                case Article_Type.Troubleshooting:
                    template = new Template_Troubleshooting(req.body);
                    break;
            }
            var update_sql = sql_template.updateSQL(template, template_type);
            let query = client.query(update_sql, [id],function(err,result){
                if(err)
                    done(err,null);
                else
                    done(err,'ok');
            });
        }], function (error, result) {
        if (error)
            res.send({status: error});
        else
            res.send({status: 'ok'});
        client.end();
    });
});
//根据id查询
router.get('/:id', function(req, res, next) {
    var id=req.params.id;
    if(id==undefined){
        res.send({status:'未指定查询id，查询失败！'});
        return;
    }
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:e});
        return;
    }
    async.waterfall([
            function (done) {
                sql = "select id,article_type from template_article where id=$1";
                query = client.query(sql, [id],function(err,result){
                    if(err)
                        done(err,null);
                    else
                        done(null,result.rows);
                });
            },
            function (rows, done) {
                if(rows.length==0) {
                    done('根据id未获取更新的记录！', null);
                    return;
                }
                var template_type = rows[0].article_type;
                if (template_type == undefined) {
                    done('操作文章类型不明确！', null);
                    return;
                }
                let sql = util.format("select * from %s where id=$1", template_type);
                query = client.query(sql, [id],function(err,result){
                    if(err)
                        done(err,null);
                    else
                        done(null,result.rows);
                });
            }], function (error, result) {
            if (error)
                res.send({status:error});
            else
                res.send({status:result});
            client.end();
        }
    )
});
//无条件查询，支持排序，分页
router.get('/', function(req, res, next) {
    let querys = req.query;
    try {
        var client = new Client(pg_config);
        client.connect();
        let sql = sql_template.querySQL(querys, 'template_article');
        let query = client.query(sql,function(err, result) {
            res.send({status: 'ok', data: result.rows});
            client.end();
        });
    }
    catch(e) {
        console.log(e);
        res.send({status: e});
    }
});

module.exports = router;