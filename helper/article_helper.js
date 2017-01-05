var _ = require('lodash');
var async=require('async');
var cmdb_api_helper = require('./cmdb_api_helper');
var dbHelper = require('../helper/db_helper');
var sql_template=new (require('../sql/SQL_Template'))();
var article_table_name = dbHelper.article_table_name, article_table_alias = dbHelper.article_table_alias,
    discussion_table_name = dbHelper.discussion_table_name, discussion_table_alias = dbHelper.discussion_table_alias;


var findITServiceItemByID = function(uuid,it_services){
    return _.find(it_services,function(it_service){
        return it_service.service.uuid === uuid;
    })
};

var serviceMapping = function(results,it_services){
    results = _.map(results,function(result){
        if(result.it_service){
            var it_services_items = [];
            _.each(result.it_service,function(uuid){
                it_services_items.push(findITServiceItemByID(uuid,it_services));
            });
            result.it_service = it_services_items;
        }
        return result;
    })
    return results;
};

var contentMapping = function(results){
    results = _.map(results,function(result){
        result = _.assign(result,result.content);
        result = _.omit(result,'content');
        return result;
    })
    return results;
};


var checkQuery = function(querys,done) {
    if(querys.countBy){
        if(querys.countBy!='ITServiceGroup'){
            done(new Error('countBy只支持ITServiceGroup!'));
        }else if(querys.filter&&querys.filter.it_service&&querys.filter.it_service.value){
            done(new Error('countByITServiceGroup则不能同时设置按it_service过滤!'));
        }else{
            done(null,querys);
        }
    }else{
        if(!querys.countOnly&&!querys.filter){
            done(new Error('没有指定查询条件!'));
        }else{
            done(null,querys);
        }
    }
};

var searchITServicesByKeyword = function(querys,done){
    if(querys.filter.it_service&&querys.filter.it_service.value&&querys.filter.it_service.value.length){
        cmdb_api_helper.getITServices(function(error,result){
            if(error){
                done(error,null);
            }else{
                querys.filter.it_service.value = result.data;
                done(null,querys);
            }
        },{search:querys.filter.it_service.value.join()});
    }else{
        done(null,querys);
    }
};

var constructWherePart = function(querys,done){
    var where = [];
    if(querys.filter.tag&&querys.filter.tag.value&&querys.filter.tag.value.length){
        let tags = querys.filter.tag.value.join("','");
        let logic=(querys.filter.tag.logic)?querys.filter.tag.logic:'or';
        if(logic=='or')
            where.push(`Array['${tags}']&&${article_table_alias}.tag`);
        else if(logic=='and')
            where.push(`Array['${tags}']<@${article_table_alias}.tag`);
    }
    if(querys.filter.keyword)
        where.push(`to_tsvector('knowledge_zhcfg'::regconfig,${article_table_alias}.title||' '|| ${article_table_alias}.content) @@ to_tsquery('knowledge_zhcfg'::regconfig,'${querys.filter.keyword}')`);
    if(querys.filter.it_service&&querys.filter.it_service.value&&querys.filter.it_service.value.length){
        let services = querys.filter.it_service.value.join("','");
        let logic=(querys.filter.it_service.logic)?querys.filter.it_service.logic:'or';
        if(logic=='or')
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
    querys.where = where;
    done(null,querys);
};

var queryArticles = function(querys,done){
    let sql=sql_template.querySQL(querys,article_table_name,querys.where,article_table_alias);
    console.log(sql);
    dbHelper.pool.query(sql,function (err, result) {
        if(err) {
            done(err, null);
        }
        done(null,result.rows);
    });
};

var articlesMappingWithITService = function(articles,callback){
    let it_service_uuids=[],it_services = [];
    for(let i=0;i<articles.length;i++){
        let row=articles[i];
        it_service_uuids = _.concat(it_service_uuids,row.it_service);
    }
    it_service_uuids = _.uniq(it_service_uuids);
    articles = contentMapping(articles);
    if(it_service_uuids.length){
        cmdb_api_helper.getITServices(function(error,result){
            if(error){
                callback(error);
            }else{
                it_services = result.data;
                articles = serviceMapping(articles,it_services);
                callback(null,articles);
            }
        },{uuids:it_service_uuids.join()})
    }else{
        callback(null,articles);
    }
};

var articlesSearchByITServiceKeyword = function(querys,callback) {
    async.waterfall([(done)=>{checkQuery(querys,done)},searchITServicesByKeyword,constructWherePart,queryArticles,articlesMappingWithITService],callback);
};

var countArticles = function(querys,done) {
    var where = querys.where;
    dbHelper.countByTableNameAndWhere(article_table_name,function(error,count){
        if(error){
            done(error);
        }else{
            done(null,count);
        }
    },where,article_table_alias)
};

var countDiscussions = function(querys,done) {
    var where = querys.where?"and"+querys.where:"";
    var query = `select count(*) from ${discussion_table_name} as ${discussion_table_alias} join ${article_table_name} as ${article_table_alias} on ${article_table_alias}.idcode=${discussion_table_alias}.idcode ${where}`;
    console.log(query);
    dbHelper.countBySql(query,function(error,count){
        if(error){
            done(error);
        }else{
            done(null,count);
        }
    })
};

var countArticlesAndDiscussionsByWhere = function(querys,done){
    async.parallel({articlesCount:(done)=>{countArticles(querys,done)}, discussionsCount:(done)=>{countDiscussions(querys,done)}}, done);
}

var countArticlesAndDiscussionsByITServiceKeyword = function(querys,callback){
    async.waterfall([(done)=>{checkQuery(querys,done)},searchITServicesByKeyword,constructWherePart,countArticlesAndDiscussionsByWhere],callback)
};

var countArticlesAndDiscussions = function(querys,callback){
    async.waterfall([(done)=>{checkQuery(querys,done)},constructWherePart,countArticlesAndDiscussionsByWhere],callback)
};

var getITServiceGroups = function(querys,done) {
    cmdb_api_helper.getITServiceGroups(function(error,result){
        if(error){
            done(error,null);
        }else{
            querys.it_service_groups = result.data.results;
            done(null,querys)
        }
    });
};

var countArticlesAndDiscussionsByITServiceGroup = function(querys,done){
    var groups = [];
    _.each(querys.it_service_groups,(group)=>{
        var services=[];
        _.each(group.services,(service)=>{
            services.push(service.uuid);
        });
        querys.filter.it_service = {},querys.filter.it_service.value = services;
        delete querys.countBy;
        countArticlesAndDiscussions(querys,function(error,result){
            if(error){
                done(error);
            }
            group.count=result;
            groups.push(group);
            if(groups.length === querys.it_service_groups.length){
                done(null,groups);
            }
        })
    });
}

var countArticlesAndDiscussionsByITServiceGroups = function(querys,callback){
    async.waterfall([(done)=>{checkQuery(querys,done)},getITServiceGroups,countArticlesAndDiscussionsByITServiceGroup],callback);
};

module.exports.articlesMappingWithITService = articlesMappingWithITService;
module.exports.articlesSearchByITServiceKeyword = articlesSearchByITServiceKeyword;
module.exports.countArticlesAndDiscussionsByITServiceKeyword = countArticlesAndDiscussionsByITServiceKeyword;
module.exports.countArticlesAndDiscussionsByITServiceGroups = countArticlesAndDiscussionsByITServiceGroups;

