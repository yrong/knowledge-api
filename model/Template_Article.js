var _ = require('lodash');
var Article_Type = require('./Article_Type');//文章类型
var Template_Article= function(options){
    // _.assign(this,_.omit(options,['token','description','analysis','solution','workaround','purpose','how_it_works','steps','body']));
    this.content={};
    for(var key in options) {
        if(key=='id')
            this.id=options[key];
        if(key=='idcode')
            this.idcode=options[key];
        if(key=='title')
            this.title=options[key];
        if(key=='it_service[]')
        {
            if(typeof options['it_service[]']=='string')
                this.it_service=[options['it_service[]']];
            else if(typeof options['it_service[]']=='object')
                this.it_service=options['it_service[]'];
        }
        if(key=='tag[]')
        {
            if(typeof options['tag[]']=='string')
                this.tag=[options['tag[]']];
            else if(typeof options['tag[]']=='object')
                this.tag=options['tag[]'];
        }
        if(key=='author')
            this.author=options[key];
        if(key=='created_at')
            this.created_at=options[key];
        if(key=='updated_at')
            this.updated_at=options[key];
        if(key=='ref_links[]')
        {
            if(typeof options['ref_links[]']=='string')
                this.ref_links=[options['ref_links[]']];
            else if(typeof options['ref_links[]']=='object')
                this.ref_links=options['ref_links[]'];
        }
        if(key=='tasks')
            this.tasks=options[key];
        if(key=='article_type')
            this.article_type=options[key];
    }

    switch(this.article_type){
        case Article_Type.Troubleshooting:
            this.content.description=options['description'];
            this.content.analysis=options['analysis'];
            this.content.solution=options['solution'];
            this.content.workaround=options['workaround'];
            break;
        case Article_Type.Guide:
            this.content.purpose=options['purpose'];
            this.content.how_it_works=options['how_it_works'];
            this.content.steps=options['steps'];
            break;
        case Article_Type.Free:
            this.content.body=options['body'];
            break;
        case Article_Type.Share:
            this.content.description=options['description'];
            break;
    }
}

Template_Article.prototype.validate=function(){
    if(this.title===undefined||this.title===null||this.title==='')
        return false;
    if(this.it_service===undefined||this.it_service===null||this.it_service==='')
        return false;
    if(this.content===undefined||this.content===null||this.content==='')
        return false;
    //如果是故障类型，若无解决办法，临时措施必填
    if(this.article_type==Article_Type.Troubleshooting) {
        if(this.content.solution==undefined)//解决办法未输入
        {
            if(this.content.workaround==undefined)
                return false;
        }
    }
    return true;
}

module.exports = Template_Article;
