var _ = require('lodash');
var async=require('async');
var cmdb_api_helper = require('./cmdb_api_helper');
var dbHelper = require('../helper/db_helper');
var sql_template=new (require('../sql/SQL_Template'))();
var {article_table_name,article_table_alias,discussion_table_name,discussion_table_alias} = dbHelper
let models = require('../models');
let responseSender = require('./responseSender');


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
            querys.error = new Error('countBy只支持ITServiceGroup!')
        }else if(querys.filter&&querys.filter.it_service){
            querys.error = new Error('countByITServiceGroup则不能同时设置按it_service过滤!')
        }
    }else{
        if(!querys.countOnly&&!querys.filter){
            querys.error = new Error('没有指定查询条件!')
        }
    }
    if(querys.error)
        done(querys.error,querys)
    else
        done(null,querys);
};

var getITServiceValues = function(querys) {
    if(querys.v1)
        return _.values(querys.filter.it_service)[0]
    else
        return querys.filter.it_service.value
}

var setITServiceValues = function(querys,result) {
    if(querys.v1){
        let key = _.keys(querys.filter.it_service)[0]||'$overlap'
        if(_.isArray(result))
            querys.filter.it_service[key] = result
    }
    else
        querys.filter.it_service.value = result
}

var searchITServicesByKeyword = function(querys,done){
    if(querys.filter.it_service){
        let search = getITServiceValues(querys).join()
        cmdb_api_helper.getITServices(function(error,result){
            if(error){
                done(error,null);
            }else{
                setITServiceValues(querys,result.data);
                done(null,querys);
            }
        },{search:search});
    }else{
        done(null,querys);
    }
};

var constructWherePart = function(querys,done){
    var where;
    if(querys.v1){
        var queryGenerator = models.sequelize.getQueryInterface().QueryGenerator
        var options = {where:querys.filter?dbHelper.fullTextOperatorProcessor(querys.filter):{}};
        where = queryGenerator.getWhereConditions(options.where,article_table_alias,models['Article'],options);
    }else{
        where = [];
        if(querys.filter.tag&&querys.filter.tag.value&&querys.filter.tag.value.length){
            let tags = _.filter(querys.filter.tag.value,(val)=>{return val}).join("','");
            if(tags) {
                let logic = (querys.filter.tag.logic) ? querys.filter.tag.logic : 'or';
                if (logic == 'or')
                    where.push(`Array['${tags}']&&${article_table_alias}.tag`);
                else if (logic == 'and')
                    where.push(`Array['${tags}']<@${article_table_alias}.tag`);
            }
        }
        if(querys.filter.keyword)
            where.push(`to_tsvector('knowledge_zhcfg'::regconfig,${article_table_alias}.title||' '|| ${article_table_alias}.content) @@ to_tsquery('knowledge_zhcfg'::regconfig,'${querys.filter.keyword}')`);
        if(querys.filter.it_service&&querys.filter.it_service.value&&querys.filter.it_service.value.length){
            let services = _.filter(querys.filter.it_service.value, (val)=>{return val}).join("','");
            if(services){
                let logic=(querys.filter.it_service.logic)?querys.filter.it_service.logic:'or';
                if(logic=='or')
                    where.push(`Array['${services}']&&${article_table_alias}.it_service`);
                else if(querys.filter.it_service.logic=='and')
                    where.push(`Array['${services}']<@${article_table_alias}.it_service`);
            }
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
    }
    querys.where = where;
    done(null,querys);
};

var queryArticles = function(querys,done){
    let sql=sql_template.querySQL(querys,article_table_name,querys.where,article_table_alias);
    console.log(sql);
    dbHelper.pool.query(sql,function (err, result) {
        if(err) {
            done(err, null);
        }else{
            querys.result = result.rows;
            done(null,querys);
        }
    });
};

var queryArticlesV1AndMappingWithITService = function(querys,done){
    let condition = dbHelper.buildQueryCondition(querys)
    return models['Article'].findAll(condition)
        .then((objs)=> {
                querys.result = objs
                articlesMappingWithITService(querys,done)
            }
        )
        .catch((error)=>{
            done(error,querys)
        })
};

var articlesMappingWithITService = function(querys,callback){
    let articles = querys.result;
    let it_service_uuids=[],it_services = [];
    for(let i=0;i<articles.length;i++){
        let row=articles[i];
        it_service_uuids = _.concat(it_service_uuids,row.it_service);
    }
    it_service_uuids = _.uniq(it_service_uuids);
    if(!querys.v1)
        articles = contentMapping(articles);
    if(it_service_uuids.length){
        cmdb_api_helper.getITServices(function(error,result){
            if(error){
                callback(error,querys);
            }else{
                it_services = result.data;
                articles = serviceMapping(articles,it_services);
                querys.result = articles;
                callback(null,querys);
            }
        },{uuids:it_service_uuids.join()})
    }else{
        callback(null,querys);
    }
};

var articlesSearchByITServiceKeyword = function(querys) {
    if(querys.v1)
        async.waterfall([(done)=>{checkQuery(querys,done)},searchITServicesByKeyword,queryArticlesV1AndMappingWithITService],sendResponse);
    else
        async.waterfall([(done)=>{checkQuery(querys,done)},searchITServicesByKeyword,constructWherePart,queryArticles,articlesMappingWithITService],sendResponse);
};

var countArticles = function(querys,done) {
    var where = querys.where,table_name
    if(querys.v1){
        table_name = dbHelper.article_v1_table_name
        table_name = `"${table_name}"`
    }
    else
        table_name = dbHelper.article_table_name
    dbHelper.countByTableNameAndWhere(table_name,function(error,count){
        if(error){
            done(error);
        }else{
            done(null,count);
        }
    },where,article_table_alias)
};

var countDiscussions = function(querys,done) {
    var where = querys.where?"and "+querys.where:"",primary_table,sub_table,primary_join_field,sub_join_field;
    if(querys.v1){
        primary_table = dbHelper.discussion_v1_table_name
        sub_table = dbHelper.article_v1_table_name
        primary_table = `"${primary_table}"`
        sub_table = `"${sub_table}"`
        primary_join_field = 'article_id'
        sub_join_field = 'uuid'
    }
    else{
        primary_table = dbHelper.discussion_table_name
        sub_table = dbHelper.article_table_name
        primary_join_field = 'idcode'
        sub_join_field = 'idcode'
    }
    var query = `select count(*) from ${primary_table} as ${discussion_table_alias} join ${sub_table} as ${article_table_alias} on ${discussion_table_alias}.${primary_join_field}=${article_table_alias}.${sub_join_field} ${where}`;
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

var countArticlesAndDiscussionsByITServiceKeyword = function(querys){
    async.waterfall([(done)=>{checkQuery(querys,done)},searchITServicesByKeyword,constructWherePart,countArticlesAndDiscussionsByWhere],function(err, result){
        if(err)
            sendResponse(err,querys)
        else{
            querys.result = result
            sendResponse(null,querys)
        }
    })
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
        querys.filter.it_service = {};
        setITServiceValues(querys,services);
        delete querys.countBy;
        countArticlesAndDiscussions(querys,function(error,result){
            if(error)
                done(error,querys)
            group.count=result;
            groups.push(group);
            if(groups.length === querys.it_service_groups.length){
                querys.result = groups
                done(null,querys);
            }
        })
    });
}

var sendResponse = function(error,querys) {
    if(error)
        responseSender(querys.req,querys.res,error)
    else
        responseSender(querys.req,querys.res,querys.result)
}

var countArticlesAndDiscussionsByITServiceGroups = function(querys){
    async.waterfall([(done)=>{checkQuery(querys,done)},getITServiceGroups,countArticlesAndDiscussionsByITServiceGroup],sendResponse);
};

module.exports.articlesMappingWithITService = articlesMappingWithITService;
module.exports.articlesSearchByITServiceKeyword = articlesSearchByITServiceKeyword;
module.exports.countArticlesAndDiscussionsByITServiceKeyword = countArticlesAndDiscussionsByITServiceKeyword;
module.exports.countArticlesAndDiscussionsByITServiceGroups = countArticlesAndDiscussionsByITServiceGroups;

