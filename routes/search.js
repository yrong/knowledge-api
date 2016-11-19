var express = require('express');
var Client=require('pg').Client;
var router = express.Router();
var Config = require('../config');
var async=require('async');
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');

var pg_config=new Config().PG_Connection;//pg的连接参数
var sql_template=new SQL_Template();

//不指定字段模糊全文检索
router.get('/:keywords', function(req, res, next) {
    let keywords=req.params.keywords;
    let querys=req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    //let wheres="f1('knowledge_zhcfg'::regconfig,t::text) @@ to_tsquery($1)";
    let wheres="to_tsvector('knowledge_zhcfg'::regconfig,title||' '||content) @@ to_tsquery($1)";
    let sql = sql_template.querySQL(querys, 'template_article',wheres);
    try {
        var client = new Client(pg_config);
        console.log(sql);
        client.connect();

        async.parallel({
            Results:function(done){
                let query = client.query(sql, [keywords],function (err, result) {
                    if (err)
                        done('查询发生错误！', null);
                    else {
                        let results = [];
                        for (let i = 0; i < result.rows.length; i++) {
                            let row = result.rows[i];
                            let content = row.content;
                            delete row.content;
                            for (var key in content) {
                                row[key] = content[key];
                                //用正则最好了
                                let detail=content[key].split('<br/>');
                                for(let i=0;i<detail.length;i++){
                                    let _index=detail[i].indexOf(keywords);
                                    if(_index>-1)//该章节包含关键字
                                    {
                                        let length=detail[i].length;
                                        let start,end;
                                        if(_index>=40)
                                            start=_index-40;
                                        else
                                            start=0;
                                        if((length-_index)>44)//总长度比关键字长度还长
                                            end=_index+40;
                                        else
                                            end=length;
                                        row.detail=detail[i].substring(start,end);
                                        break;
                                    }
                                }
                            }
                            results.push(row);
                        }
                        done(null,results);
                    }

                });
            },
            Count:function(done){
                let query = client.query("select count(*) count from template_article t where to_tsvector('knowledge_zhcfg'::regconfig,title||' '||content) @@ to_tsquery($1)",[keywords],function(err, result){
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
        res.send({status: '数据库连接发生错误！'});
    }
});

//根据关键字段查询
router.get('/', function(req, res, next) {
    let wheres=[];
    let querys=req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    for(let key in querys){
        if(key!='sortby'&&key!='order'&&key!='per_page'&&key!='page'){
            wheres.push(util.format("%s='%s'",key,querys[key]));
            delete querys[key];
        }
    }
    wheres='where '+wheres.join(' and ');
    var client = new Client(pg_config);
    try {
        client.connect();
    }
    catch(e){
        res.send({status: '数据库连接发生错误！'});
        return;
    }
    async.parallel({
        Results:function(done){
            let sql=sql_template.querySQL(querys,'template_article',wheres);
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
            let query = client.query(util.format('select count(*) count from template_article %s',wheres),function(err, result){
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
});


module.exports = router;