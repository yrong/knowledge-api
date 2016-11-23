var express = require('express');
var Client=require('pg').Client;
var router = express.Router();
var Config = require('../config');
var async=require('async');
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var User=require('../sql/User');
var IT_Services=require('../model/IT_Services');
var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数
var user=new User();
var sql_template=new SQL_Template();
//it_services新增
router.post('/', function(req, res, next) {
    //获取文章类型
    var token=req.body.token;
    var it_services=new IT_Services(req.body);
    var client = new Client(pg_config);
    try{
        client.connect();
    }
    catch(e){
        res.send({status:'数据库连接错误'});
        return;
    }
    async.waterfall([
            function (done) {
                user.token_validate(token,function(info){
                    if(!info)
                        done('fail',null);
                    else
                        done(null,true);
                });
            },
            function (result, done) {
                //查询parent的idcode对应的path
                var parent=req.body.parent;
                if(parent==undefined)
                    done(null,undefined);
                else
                {
                    //查询上级的depend和path
                    let sql='select dependency,path from it_services where idcode=$1';
                    client.query(sql,[parent],function(err, result){
                        console.log(err);
                        if(err)
                            done(err,null);
                        else
                            done(null,result.rows[0]);
                    });
                }
            },
            function (result, done) {
                var insert_sql;
                it_services.idcode=uuid();
                if(result!==undefined)
                {
                    it_services.dependency=it_services.dependency.concat(result.dependency);
                    it_services.path=result.path+'.'+it_services.idcode;
                }
                else//父节点是空，代表是服务分组
                    it_services.path=it_services.idcode;
                insert_sql = sql_template.insertIT(it_services);
                console.log(insert_sql);
                let query = client.query(insert_sql.sql,insert_sql.values,function(err, result){
                    console.log(err,result);
                    if(err)
                        done(err,null);
                    else
                        done(null,'ok');

                });
            }

    ], function (error, result) {
        if (error)
            res.send({status:error});
        else
            res.send({status:'ok'});
        client.end();
    })
});
//根据idcode删除。会级联删除，注意！
router.delete('/:idcode', function(req, res, next) {
    //获取文章类型
    var idcode=req.params.idcode;
    if(idcode==undefined){
        res.send({status:'未指定删除id，删除失败！'});
        return;
    }
    var token=req.body.token;
    async.waterfall([
            function (done) {
                user.token_validate(token,function(info){
                    if(!info)
                        done('token验证失败，无权限更改数据！',null);
                    else
                        done(null,true);
                });
            },
            function (result, done) {
                var client = new Client(pg_config);
                client.connect();
                let query = client.query('delete from it_services where id in (select id from it_services a,(select path from it_services where idcode=$1) b where a.path<@b.path)', [idcode],function(err, result){
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
//根据idcode更新若干字段
router.put('/:idcode', function(req, res, next) {
    var idcode=req.params.idcode;
    var token=req.body.token;
    if(idcode==undefined){
        res.send({status:'未指定更新idcode，更新失败！'});
        return;
    }
    var it_services=new IT_Services(req.body);
    if(it_services.name==undefined&&it_services.dependency==undefined){
        res.send({status:'未指定更新字段数据，更新失败！'});
        return;
    }
    var client = new Client(pg_config);
    try{
        client.connect();
    }
    catch(e){
        res.send({status:'数据库连接错误'});
        return;
    }
    async.waterfall([
        function (done) {
            user.token_validate(token,function(info){
                if(!info)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            //更新name
            if(it_services.name!=undefined) {
                let sql = 'update it_services set name=$1 where idcode=$2';
                let values = [it_services.name, idcode];
                let query = client.query(sql, values, function (err, result) {
                    if (err)
                        done(err, null);
                    else{
                        if(it_services.dependency!=undefined)
                            done(null, 'ok');
                        else
                            done(null, undefined);
                    }
                });
            }
            else{
                if(it_services.dependency!=undefined)
                    done(null, 'ok');
                else
                    done(null, undefined);
            }
        },
        function (result, done) {
            if(result==undefined)//没有依赖，直接跳走
                done(null,undefined);
            else{//查询信息
                let sql='select * from it_services where idcode=$1';
                client.query(sql,[idcode],function(err, result){
                    if(err)
                        done(err,null);
                    else{
                        var row=result.rows[0];
                        if(row==undefined)
                            done('未获取要更新的记录！',null);
                        else{
                            let path=row.path;
                            let dependency=row.dependency;
                            let sql=util.format("update it_services set dependency=string_to_array(regexp_replace(array_to_string(dependency, ','), '%s', '%s'),',') where path<@'%s'",dependency.join(','),it_services.dependency.join(','),path);
                            done(null,sql);
                        }
                    }
                });
            }
        },
        function (sql, done) {
            if(sql==undefined)//没有依赖，直接跳走
                done(null,undefined);
            else{
                let query = client.query(sql,function(err, result){
                    if(err)
                        done(err,null);
                    else
                        done(null,'ok');

                });
            }
        }], function (error, result) {
        if (error)
            res.send({status: error});
        else
            res.send({status: 'ok'});
        client.end();
    });
});
//根据idcode更新某一个字段
router.patch('/:idcode', function(req, res, next) {
    var idcode=req.params.idcode;
    var token=req.body.token;
    if(idcode==undefined){
        res.send({status:'未指定更新idcode，更新失败！'});
        return;
    }
    var it_services=new IT_Services(req.body);
    if(it_services.name==undefined&&it_services.dependency==undefined){
        res.send({status:'未指定更新字段数据，更新失败！'});
        return;
    }
    var client = new Client(pg_config);
    try{
        client.connect();
    }
    catch(e){
        res.send({status:'数据库连接错误'});
        return;
    }
    async.waterfall([
        function (done) {
            user.token_validate(token,function(info){
                if(!info)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            //更新name
            if(it_services.name!=undefined) {
                let sql = 'update it_services set name=$1 where idcode=$2';
                let values = [it_services.name, idcode];
                let query = client.query(sql, values, function (err, result) {
                    if (err)
                        done(err, null);
                    else
                        done(null, undefined);
                });
            }
            else{
                if(it_services.dependency!=undefined)
                    done(null, 'ok');
                else
                    done(null, undefined);
            }
        },
        function (result, done) {
            if(result==undefined)//没有依赖，直接跳走
                done(null,undefined);
            else{//查询信息
                let sql='select * from it_services where idcode=$1';
                client.query(sql,[idcode],function(err, result){
                    if(err)
                        done(err,null);
                    else{
                        var row=result.rows[0];
                        if(row==undefined)
                            done('未获取要更新的记录！',null);
                        else{
                            let path=row.path;
                            let dependency=row.dependency;
                            let sql=util.format("update it_services set dependency=string_to_array(regexp_replace(array_to_string(dependency, ','), '%s', '%s'),',') where path<@'%s'",dependency.join(','),it_services.dependency.join(','),path);
                            done(null,sql);
                        }
                    }
                });
            }
        },
        function (sql, done) {
            if(sql==undefined)//没有依赖，直接跳走
                done(null,undefined);
            else{
                let query = client.query(sql,function(err, result){
                    if(err)
                        done(err,null);
                    else
                        done(null,'ok');

                });
            }
        }], function (error, result) {
        if (error)
            res.send({status: error});
        else
            res.send({status: 'ok'});
        client.end();
    });
});
//根据idcode查询，只查询该it_services子服务
router.get('/:idcode', function(req, res, next) {
    var idcode=req.params.idcode;
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:"查询服务器发生错误！"});
        return;
    }
    let sql;//查询某个idcode下的子服务列表
    sql='select a.* from it_services a,(select nlevel(path) as level,path from it_services where idcode=$1) b where a.path<@b.path and nlevel(a.path)=(b.level+1)';
    var query = client.query(sql, [idcode],function(err,result){
        if(err)
            res.send({status:'查询发生错误！'});
        else
            res.send({status:result.rows});
    });
});
//分组查询
router.get('/', function(req, res, next) {
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status:"查询服务器发生错误！"});
        return;
    }
    let sql='select * from it_services where nlevel(path)=1';
    var query = client.query(sql,function(err,result){
        if(err)
            res.send({status:'查询发生错误！'});
        else
            res.send({status:result.rows});
    });
});
var uuid=function() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for ( var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the
    // clock_seq_hi_and_reserved
    // to 01
    s[8] = s[13] = s[18] = s[23] = "";

    var uuid = s.join("");
    return uuid;
}
module.exports = router;