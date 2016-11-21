var util=require('util');
var uuid=require('node-uuid');
var SQL_Template=function(){

};

SQL_Template.prototype.insertSQL=function(template,tb_name){
    let sql='';
    let keys=[];
    let values=[];
    let items=[];
    let k=0;
    for(let key in template){
        if(template[key]==undefined||template[key]==''||typeof template[key]=='function')
            continue;
        if(template[key].constructor==Array)//如果是数组类型
            template[key]='{"' + template[key].join('","') + '"}';
        else if(template[key].constructor==Object)
            template[key]=JSON.stringify(template[key]);//json对象转字符串
        keys.push(key);
        values.push(util.format('%s',template[key]));
        k++;
        items.push('$'+k);
    }
    sql=util.format("insert into %s(%s,idcode,created_at) VALUES (%s,uuid_generate_v4(),now())",tb_name,keys.join(','),items.join(','));
    console.log(sql,values);
    return {sql:sql,values:values};
}
SQL_Template.prototype.updateSQL=function(template,tb_name){
    let items=[];
    let content;
    for(let key in template){
        if(key=='id')
            continue;
        if(template[key]==undefined||template[key]==''||typeof template[key]=='function')
            continue;
        if(key=='it_service')
            template[key]='{"' + template[key].join('","') + '"}';
        if(key=='tag')
            template[key]='{"' + template[key].join('","') + '"}';
        if(key=='ref_links')
            template[key]='{"' + template[key].join('","') + '"}';
        if(key=='content'){
            content=JSON.stringify(template[key]);//json对象转字符串
            continue;
        }
        if(typeof template[key]=='string')
            items.push(util.format("%s='%s'",key,template[key]));
        else if(typeof template[key]=='number'||typeof template[key]=='boolean')
            items.push(util.format('%s=%s',key,template[key]));
    }
    let sql;
    if(tb_name=='template_article')
        sql=util.format("update template_article t2 set %s,updated_at=now(),content=t1.content from (select content||jsonb'%s' as content,id from template_article) t1 where t1.id=t2.id and t2.idcode=$1",items.join(','),content);
    else
        sql=util.format("update %s set %s,updated_at=now() where idcode=$1",tb_name,items.join(','));
    console.log(sql);
    return sql;
}
SQL_Template.prototype.querySQL=function(querys,tb_name,wheres){
    let sql=util.format("select * from %s t",tb_name);
    if(wheres!==undefined)
        sql+=" where "+wheres;
    if(querys.sortby!=undefined)
        sql+=" order by "+querys.sortby;
    else
        sql+=" order by id";
    if(querys.order!=undefined)
        sql+=" "+querys.order;
    if(querys.page!=undefined&&querys.per_page!=undefined)
        sql+=util.format(' limit %s offset %s',querys.per_page,(parseInt(querys.page)-1)*parseInt(querys.per_page));
    return sql;
}


SQL_Template.prototype.insertDiscussions=function(discussions){
    let sql='';
    let keys=[];
    let values=[];
    let items=[];
    let k=0;
    for(let key in discussions){
        if(discussions[key]==undefined||discussions[key]==''||typeof discussions[key]=='function')
            continue;
        if(key=='dis_to')
            discussions[key]='{"' + discussions[key].join('","') + '"}';
        keys.push(key);
        values.push(util.format('%s',discussions[key]));
        k++;
        items.push('$'+k);
    }
    sql=util.format("insert into discussions(%s,created_at,dis_idcode) VALUES (%s,now(),uuid_generate_v4())",keys.join(','),items.join(','));
    console.log(sql,values);
    return {sql:sql,values:values};
}




module.exports = SQL_Template;