const _ = require('lodash');
const cmdb_api_helper = require('./cmdb_api_helper');
const dbHelper = require('../helper/db_helper');
const {article_table_alias,discussion_table_alias} = dbHelper
const models = require('../models');
const logger = require('../logger')

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

var checkQuery = function(querys) {
    if(querys.countBy){
        if(querys.countBy!='ITServiceGroup'){
            throw new Error('countBy support ITServiceGroup only!')
        }else if(querys.filter&&querys.filter.it_service){
            throw new Error('countByITServiceGroup is conflict with filter by it_service!')
        }
    }
    if(!querys.countOnly&&!querys.filter&&!querys.countBy){
        throw new Error('no query condition!')
    }
};

var getITServiceValues = function(querys) {
    return _.values(querys.filter.it_service)[0]
}

var setITServiceValues = function(querys,result) {
    let key = _.keys(querys.filter.it_service)[0]||'$overlap'
    if(_.isArray(result))
        querys.filter.it_service[key] = result
}

var searchITServicesByKeyword = async function(querys){
    let search = getITServiceValues(querys).join()
    let result = await cmdb_api_helper.getITServices({search:search})
    setITServiceValues(querys,result.data)
};

var constructWherePart = function(querys){
    let queryGenerator = models.sequelize.getQueryInterface().QueryGenerator
    let options = {where:querys.filter||{}}
    let where = queryGenerator.getWhereConditions(querys.filter||{},article_table_alias,models['Article'],options)
    querys.where = where
};

var queryArticlesV1AndMappingWithITService = async function(querys){
    let condition = dbHelper.buildQueryCondition(querys)
    let articles  = await models['Article'].findAll(condition)
    articles = await articlesMappingWithITService(articles)
    return articles
};

var articlesMappingWithITService = async function(articles){
    let it_service_uuids = _.uniq(_.map(articles,(article)=>{return article.it_service}))
    if(it_service_uuids.length){
        let result = await cmdb_api_helper.getITServices({uuids:it_service_uuids.join()})
        articles = serviceMapping(articles,result.data)
    }
    return articles
};

var articlesSearchByITServiceKeyword = async function(querys) {
    checkQuery(querys)
    if(querys.filter.it_service){
        await searchITServicesByKeyword(querys)
    }
    let articles = await queryArticlesV1AndMappingWithITService(querys)
    return articles
};

var countArticles = async function(querys) {
    var where = querys.where,table_name = `"${dbHelper.article_v1_table_name}"`,count
    count = await dbHelper.countByTableNameAndWhere(table_name,where,article_table_alias)
    return count
};

var countDiscussions = async function(querys) {
    var where = querys.where?"and "+querys.where:"",primary_table,sub_table,primary_join_field,sub_join_field,query,count
    primary_table = `"${dbHelper.discussion_v1_table_name}"`
    sub_table = `"${dbHelper.article_v1_table_name}"`
    primary_join_field = 'article_id'
    sub_join_field = 'uuid'
    query = `select count(*) from ${primary_table} as ${discussion_table_alias} join ${sub_table} as ${article_table_alias} on ${discussion_table_alias}.${primary_join_field}=${article_table_alias}.${sub_join_field} ${where}`;
    count = await dbHelper.countBySql(query)
    return count
};

var countArticlesAndDiscussionsByWhere = async function(querys){
    let articlesCount = await countArticles(querys)
    let discussionsCount = await countDiscussions(querys)
    return {articlesCount,discussionsCount}
}

var countArticlesAndDiscussionsByITServiceKeyword = async function(querys){
    checkQuery(querys)
    if(querys.filter&&querys.filter.it_service){
        await searchITServicesByKeyword(querys)
    }
    let result = await countArticlesAndDiscussions(querys)
    return result
};

var countArticlesAndDiscussions = async function(querys){
    constructWherePart(querys)
    return await countArticlesAndDiscussionsByWhere(querys)
};


var countArticlesAndDiscussionsByITServiceGroup = async function(querys,it_service_groups){
    var groups = [],services,countInfo
    for(let group of it_service_groups){
        services=[];
        _.each(group.members,(service)=>{
            services.push(service.uuid);
        });
        querys.filter = querys.filter ||{};
        querys.filter.it_service = {};
        setITServiceValues(querys,services);
        delete querys.countBy;
        countInfo = await countArticlesAndDiscussions(querys)
        group.count=countInfo;
        groups.push(group);
    }
    return groups
}


var countArticlesAndDiscussionsByITServiceGroups = async function(querys){
    let result,it_service_groups
    checkQuery(querys)
    result = await cmdb_api_helper.getITServiceGroups(querys)
    if(!result||!_.isArray(result.data)){
        throw new Error('find it service group from cmdb error!')
    }
    it_service_groups = result.data
    return await countArticlesAndDiscussionsByITServiceGroup(querys,it_service_groups)
};

module.exports.articlesMappingWithITService = articlesMappingWithITService;
module.exports.articlesSearchByITServiceKeyword = articlesSearchByITServiceKeyword;
module.exports.countArticlesAndDiscussionsByITServiceKeyword = countArticlesAndDiscussionsByITServiceKeyword;
module.exports.countArticlesAndDiscussionsByITServiceGroups = countArticlesAndDiscussionsByITServiceGroups;

