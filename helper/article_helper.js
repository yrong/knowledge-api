const _ = require('lodash');
const cmdb_api_helper = require('./cmdb_api_helper');
const dbHelper = require('../helper/db_helper');
const {article_table_alias,discussion_table_alias} = dbHelper
const models = require('../models');
const jp = require('jsonpath');

var findITServiceItemByID = function(uuid,it_services){
    return _.find(it_services,function(it_service){
        return it_service.service.uuid === uuid;
    })
};

var articlesMapping = function(articles,it_services){
    articles = _.map(articles,function(article){
        articleMapping(article,it_services)
        articleMapping(article.old,it_services)
        articleMapping(article.new,it_services)
        articleMapping(article.update,it_services)
        return article;
    })
    return articles;
};

var articleMapping = function(article,it_services) {
    if(article&&article.it_service){
        let it_services_items = []
        _.each(article.it_service,function(it_service_uuid){
            it_services_items.push(findITServiceItemByID(it_service_uuid,it_services));
        });
        article.it_service = it_services_items;
    }
    return article
}

var containsITService = (filter) => {
    let services = jp.query(filter,'$..it_service')
    return services.length>0;
}


var checkQuery = function(querys) {
    if(querys.countBy){
        if(querys.countBy!='ITServiceGroup'){
            throw new Error('countBy support ITServiceGroup only!')
        }else if(containsITService(querys.filter)){
            throw new Error('countByITServiceGroup is conflict with filter by it_service!')
        }
    }
    if(!querys.countOnly&&!querys.filter&&!querys.countBy){
        throw new Error('no query condition!')
    }
};

var getITServiceValues = function(querys) {
    let services = jp.query(querys.filter,'$..it_service')[0]
    return _.values(services)[0]
}

var setITServiceValues = function(querys,result) {
    let services = jp.query(querys.filter,'$..it_service')[0]
    let key = _.keys(services)[0]||'$overlap'
    let value = {}
    value[key] = result
    if(_.isArray(result)){
        jp.value(querys.filter, `$..it_service`,value)
    }
    return querys;
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
    let articles  = await models['Article'].findAndCountAll(condition)
    articles.rows = await articlesMappingWithITService(articles.rows)
    return articles
};

var articlesMappingWithITService = async function(articles){
    let it_service_uuids  = [],result
    _.each(articles,(article)=>{
        if(article.it_service)
            it_service_uuids = it_service_uuids.concat(article.it_service)
        if(article.old&&article.old.it_service)
            it_service_uuids = it_service_uuids.concat(article.old.it_service)
        if(article.new&&article.new.it_service)
            it_service_uuids = it_service_uuids.concat(article.new.it_service)
        if(article.update&&article.update.it_service)
            it_service_uuids = it_service_uuids.concat(article.update.it_service)
    })
    it_service_uuids = _.uniq(it_service_uuids)
    if(it_service_uuids.length){
        result = await cmdb_api_helper.getITServices({uuids:it_service_uuids.join()})
        articles = articlesMapping(articles,result.data)
    }
    return articles
};

var articlesSearchByITServiceKeyword = async function(querys) {
    checkQuery(querys)
    if(containsITService(querys.filter)){
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
    if(containsITService(querys.filter)){
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


module.exports = {articlesMappingWithITService,articlesSearchByITServiceKeyword,
    countArticlesAndDiscussionsByITServiceKeyword,countArticlesAndDiscussionsByITServiceGroups}

