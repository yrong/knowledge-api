var express = require('express');
var pg = require('pg');
var Client=pg.Client;
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
                if(info===undefined)
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
                it_services.dependency=ArrayUnique(it_services.dependency);
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
                    if(info===undefined)
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
                if(info===undefined)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            //查询depend和path
            let sql='select dependency from it_services where idcode=$1';
            client.query(sql,[idcode],function(err, result){
                console.log(err);
                if(err)
                    done(err,null);
                else
                    done(null,result.rows[0]);
            });
        },
        function (result, done) {
            it_services.dependency=it_services.dependency.concat(result.dependency);
            it_services.dependency=ArrayUnique(it_services.dependency);
            var update_format = sql_template.updateFormat(it_services);

            let sql=util.format("update it_services set %s where idcode=$1",update_format.join(','));
            let query = client.query(sql, [idcode],function(err,result){
                if(err)
                    done('更新发生异常错误！',null);
                else
                    done(err,'ok');
            });
        },
    ], function (error, result) {
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
    if(it_services.getLength()>1)
    {
        res.send({status:'更新字段超过多个，rest权限不够，考虑put请求，更新失败！'});
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
                if(info===undefined)
                    done('token验证失败，无权限更改数据！',null);
                else
                    done(null,true);
            });
        },
        function (result, done) {
            //查询depend和path
            let sql='select dependency from it_services where idcode=$1';
            client.query(sql,[idcode],function(err, result){
                console.log(err);
                if(err)
                    done(err,null);
                else
                    done(null,result.rows[0]);
            });
        },
        function (result, done) {
            it_services.dependency=it_services.dependency.concat(result.dependency);
            it_services.dependency=ArrayUnique(it_services.dependency);
            var update_format = sql_template.updateFormat(it_services);
            let sql=util.format("update it_services set %s where idcode=$1",update_format.join(','));
            let query = client.query(sql, [idcode],function(err,result){
                if(err)
                    done('更新发生异常错误！',null);
                else
                    done(err,'ok');
            });
        },
      ], function (error, result) {
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
    sql=`with temservice as (select a.* from it_services a,(select nlevel(path) as level,path from it_services where idcode=$1) b where a.path<@b.path and nlevel(a.path)=(b.level+1))

    select a.id,a.idcode,a.name,t.dependency,a.path from temservice a, (

        select b.idcode,json_object_agg(a.idcode,a.name) dependency from it_services a,(select idcode,dependency from temservice) b
    where a.idcode=any(b.dependency) group by b.idcode

    ) t where a.idcode=t.idcode`;


    var query = client.query(sql, [idcode],function(err,result){
        if(err)
            res.send({status:'查询发生错误！'});
        else
            res.send({status:'ok',data:result.rows});
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
    let sql=`select a.id,a.idcode,a.name,t.dependency,a.path from it_services a, (

    select b.idcode,json_object_agg(a.idcode,a.name) dependency from it_services a,(select idcode,dependency from it_services where nlevel(path)=1) b
    where a.idcode=any(b.dependency) group by b.idcode

    ) t where a.idcode=t.idcode`;
    var query = client.query(sql,function(err,result){
        if(err)
            res.send({status:'查询发生错误！'});
        else
            res.send({status:'ok',data:result.rows});
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


var ArrayUnique = function(arr)
{
    arr.sort();
    var re=[arr[0]];
    for(var i = 1; i < arr.length; i++)
    {
        if( arr[i] !== re[re.length-1])
        {
            re.push(arr[i]);
        }
    }
    return re;
}
module.exports = router;