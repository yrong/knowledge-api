var express = require('express');
var router = express.Router();
var async=require('async');
var SQL_Template = require('../sql/SQL_Template');
var util=require('util');
var sql_template=new SQL_Template();
var articleHelper = require('./../helper/article_helper');
var dbHelper = require('./../helper/db_helper');
var article_table_name = dbHelper.article_table_name, article_table_alias = dbHelper.article_table_alias,
    discussion_table_name = dbHelper.discussion_table_name, discussion_table_alias = dbHelper.discussion_table_alias;

//综合查询，支持分页排序
router.all('/advanced', function(req, res, next) {//add post method for postman test purpose
    var querys,client,where = [];
    if(req.method === 'GET'){
        querys = req.query;
    }else{
        querys = req.body;
    }
    if (querys.filter == undefined) {
        res.send({status: '未指定查询条件！'});
        return;
    }
    var getITServices = function(done){
        if(querys.filter.it_service&&querys.filter.it_service.value&&querys.filter.it_service.value.length){
            articleHelper.apiInvokeFromCmdb('/api/it_services/service',{search:querys.filter.it_service.value.join()},function(error,result){
                if(error){
                    done(error,null);
                }else{
                    done(null,result.data)
                }
            });
        }else{
            done(null,[]);
        }
    };
    var constructWherePart = function(services,done){
        if(querys.filter.tag&&querys.filter.tag.value&&querys.filter.tag.value.length){
            let logic=(querys.filter.tag.logic!==undefined)?querys.filter.tag.logic:'or';
            let tags = querys.filter.tag.value.join("','");
            if(logic=='or')
                where.push(`Array['${tags}']&&${article_table_alias}.tag`);
            else if(logic=='and')
                where.push(`Array['${tags}']<@${article_table_alias}.tag`);
        }
        if(querys.filter.keyword)
            where.push(`to_tsvector('knowledge_zhcfg'::regconfig,${article_table_alias}.title||' '|| ${article_table_alias}.content) @@ to_tsquery('knowledge_zhcfg'::regconfig,'${querys.filter.keyword}')`);
        if(services&&services.length){
            services = services.join("','");
            if(querys.filter.it_service.logic=='or')
                where.push(`Array['${services}']&&${article_table_alias}.it_service`);
            else if(querys.filter.it_service.logic=='and')
                where.push(`Array['${services}']<@${article_table_alias}.it_service`);
        }
        querys.logic=(querys.logic!==undefined)?querys.logic:'and';
        if(querys.logic=='and')
            where=where.join(' and ');
        else if(querys.logic=='or')
            where=where.join(' or ');
        if(querys.sortby==undefined)
            querys.sortby='created_at';
        if(querys.order==undefined)
            querys.order='desc';//按照时间倒叙
        done(null,where);
    };
    var queryArticles = function(result,done){
        let sql=sql_template.querySQL(querys,article_table_name,where,article_table_alias);
        console.log(sql);
        dbHelper.pool.query(sql,function (err, result) {
            if(err) {
                done(err, null);
            }
            done(null,result);
        });
    };
    var articlesMapping = function(result,done){
        articleHelper.articlesMapping(result,function(err,results){
            if (err){
                done(err,null);
            }else{
                done(null,results);
            }
        })
    };
    var countArticles = function(done) {
        dbHelper.countByTableNameAndWhere(article_table_name,function(error,count){
            if(error){
                done(error);
            }else{
                done(null,count);
            }
        },where,article_table_alias)
    };
    var countDiscussions = function(done) {
        var query = `select count(*) from ${discussion_table_name} as ${discussion_table_alias} join ${article_table_name} as ${article_table_alias} on ${article_table_alias}.idcode=${discussion_table_alias}.idcode and ${where}`;
        dbHelper.countBySql(query,function(error,count){
            if(error){
                done(error);
            }else{
                done(null,count);
            }
        })
    };
    var sendResponse = function(error,result) {
        if(error)
            res.send({status: error});
        else
            res.send({status: 'ok', data: result});
    };
    var countArticlesAndDiscussions = function(result,done){
        async.parallel({articlesCount:countArticles,discussionsCount:countDiscussions},done);
    }
    if(querys.countOnly){
        async.waterfall([getITServices,constructWherePart,countArticlesAndDiscussions],sendResponse);
    }else{
        async.waterfall([getITServices,constructWherePart,queryArticles,articlesMapping],sendResponse);
    }
});

//不指定字段模糊全文检索
router.get('/:keywords', function(req, res, next) {
    let keywords=req.params.keywords;
    let querys=req.query;
    if(querys.sortby==undefined)
        querys.sortby='created_at';
    if(querys.order==undefined)
        querys.order='desc';//按照时间倒叙
    let wheres="to_tsvector('knowledge_zhcfg'::regconfig,title||' '||content) @@ to_tsquery('knowledge_zhcfg'::regconfig,$1)";
    let sql = sql_template.querySQL(querys, 'template_article',wheres);
    try {
        async.parallel({
            Results:function(done){
                let query = dbHelper.pool.query(sql, [keywords],function (err, result) {
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
                let query = dbHelper.pool.query("select count(*) count from template_article t where to_tsvector('knowledge_zhcfg'::regconfig,title||' '||content) @@ to_tsquery('knowledge_zhcfg'::regconfig,$1)",[keywords],function(err, result){
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
    async.parallel({
        Results:function(done){
            let sql=sql_template.querySQL(querys,'template_article',wheres);
            dbHelper.pool.query(sql,function(err, result) {
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
            dbHelper.pool.query(util.format('select count(*) count from template_article %s',wheres),function(err, result){
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
    });
});

module.exports = router;