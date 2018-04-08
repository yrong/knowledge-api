const _ = require('lodash');
const dbHelper = require('../helper/db_helper');
const {article_table_alias,discussion_table_alias} = dbHelper
const models = require('sequelize-wrapper-advanced').models
const jp = require('jsonpath');
const scirichon_cache = require('scirichon-cache')
const common = require('scirichon-common')

var articlesMapping = async (articles)=>{
    let result = []
    for(let article of articles){
        await articleMapping(article)
        await articleMapping(article.old)
        await articleMapping(article.new)
        await articleMapping(article.update)
        result.push(article)
    }
    return result
};

var articleMapping = async (article)=> {
    let it_services_items = [],user_item,cached_itservice
    if(article&&article.it_service){
        for(let it_service_uuid of article.it_service){
            try{
                cached_itservice = await scirichon_cache.getItemByCategoryAndID('ITService',it_service_uuid)
            }catch(err){
                console.log(err.stack||err)
            }
            if(!_.isEmpty(cached_itservice))
                it_services_items.push(cached_itservice)
        }
        article.it_service = !_.isEmpty(it_services_items)?it_services_items:article.it_service
    }
    if(article&&article.user_id){
        try{
            user_item = await scirichon_cache.getItemByCategoryAndID('User',article.user_id)
        }catch(err){
            console.log(err.stack||err)
        }
        article.actor = !_.isEmpty(user_item)?user_item:article.user_id
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
    let search = getITServiceValues(querys)
    let result = await common.apiInvoker('POST',common.getServiceApiUrl('cmdb'),'/api/searchByCypher','',{
        "category":"ITService",
        "search":search,
        "cypherQueryFile":"advanceSearchITService"
    })
    setITServiceValues(querys,result.data||result)
};

var constructWherePart = function(querys){
    let queryGenerator = models.sequelize.getQueryInterface().QueryGenerator
    let options = {where:querys.filter||{}}
    let where = queryGenerator.getWhereConditions(querys.filter||{},article_table_alias,models['Article'],options)
    querys.where = where
};

var queryArticlesV1AndMappingWithITService = async function(querys){
    let condition = common.buildQueryCondition(querys)
    let articles  = await models['Article'].findAndCountAll(condition)
    articles.rows = await articlesMapping(articles.rows)
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
    if(_.isArray(it_service_groups)){
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
    }
    return groups
}


var countArticlesAndDiscussionsByITServiceGroups = async function(querys){
    let result,it_service_groups
    checkQuery(querys)
    result = await common.apiInvoker('POST',common.getServiceApiUrl('cmdb'),'/api/members','',{"category":"ITServiceGroup"})
    it_service_groups = result.data||result
    return await countArticlesAndDiscussionsByITServiceGroup(querys,it_service_groups)
};


module.exports = {articlesMapping,articlesSearchByITServiceKeyword,
    countArticlesAndDiscussionsByITServiceKeyword,countArticlesAndDiscussionsByITServiceGroups}

