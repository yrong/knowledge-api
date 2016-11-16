var express = require('express');
var Client=require('pg').Client;
var router = express.Router();
var Config = require('../config');
var async=require('async');
var Article_Type = require('../model/Article_Type');//文章类型
var Template_Article = require('../model/Template_Article');//文章实体类型
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var Tokens=require('../sql/Tokens');
var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数

var tokens=new Tokens();
var sql_template=new SQL_Template();
//文章更新
router.post('/', function(req, res, next) {
    //获取文章类型
    var token=req.body.token;
    console.log(req.body);
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
    console.log(template);
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
            var insert_sql = sql_template.insertSQL(template, 'template_article');
            let query = client.query(insert_sql.sql,insert_sql.values,function(err, result){
                if(err)
                    done('新增发生异常错误！',null);
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
            let query = client.query('delete from template_article where idcode=$1', [idcode],function(err, result){
                if(err)
                    done('删除发生异常错误！',null);
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
router.put('/:idcode', function(req, res, next) {
    //获取文章类型
    var idcode=req.params.idcode;
    var token=req.body.token;
    if(idcode==undefined){
        res.send({status:'未指定更新idcode，更新失败！'});
        return;
    }
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:'数据库连接错误'});
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
            var template_type=Article_Type[req.body.article_type];
            if (template_type == undefined) {
                done('操作文章类型不明确！', null);
                return;
            }
            var template=new Template_Article(req.body);
            var update_sql = sql_template.updateSQL(template, 'template_article');
            let query = client.query(update_sql, [idcode],function(err,result){
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
            client.end();
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
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:'数据库连接错误！'});
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
            var template_type=Article_Type[req.body.article_type];
            if (template_type == undefined) {
                done('操作文章类型不明确！', null);
                return;
            }
            var template=new Template_Article(req.body);
            var update_sql = sql_template.updateSQL(template, 'template_article');
            let query = client.query(update_sql, [idcode],function(err,result){
                if(err)
                    done('更新发生异常错误！',null);
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
router.get('/:idcode', function(req, res, next) {
    var idcode = req.params.idcode;
    if (idcode == undefined) {
        res.send({status: '未指定查询idcode，查询失败！'});
        return;
    }
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch (e) {
        res.send({status: '数据库连接错误'});
        return;
    }
    let sql = util.format("select * from template_article where idcode=$1");
    query = client.query(sql, [idcode], function (err, result) {
        if (err)
            res.send({status: '查询错误！'});
        else
        {
            var row=result.rows[0];
            if(row==undefined)
                res.send({status: '未查询指定id的文章！'});
            else
            {
                let content=row.content;
                delete row.content;
                for(var key in content)
                {
                    row[key]=content[key];
                }
                res.send({status: 'ok',data:row});
            }
        }
        client.end();
    });




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
                let sql = sql_template.querySQL(querys, 'template_article');
                let query = client.query(sql,function(err, result) {
                    if(err) {
                        done('查询发生错误！', null);
                        return;
                    }
                    let results=[];
                    for(let i=0;i<result.rows.length;i++){
                        let row=result.rows[i];
                        let content=row.content;
                        delete row.content;
                        for(var key in content)
                        {
                            row[key]=content[key];
                        }
                        results.push(row);
                    }
                    done(null,results);
                });
            },
            Count:function(done){
                let query = client.query('select count(*) count from template_article',function(err, result){
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