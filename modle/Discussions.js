var Discussions= function(options){
    for(var key in options) {
        if(key=='id')
            this.id=options[key];
        if(key=='idcode')
            this.idcode=options[key];
        if(key=='dis_from')
            this.dis_from=options[key];
        if(key=='dis_to[]')
        {
            if(typeof options['dis_to[]']=='string')
                this.dis_to=[options['dis_to[]']];
            else if(typeof options['dis_to[]']=='object')
                this.dis_to=options['dis_to[]'];
        }
        if(key=='created_at')
            this.created_at=options[key];
        if(key=='content')
            this.content=options[key];
        if(key=='title')
            this.title=options[key];
    }
}

Discussions.prototype.validate=function(){
    if(this.idcode===undefined||this.idcode===null||this.idcode==='')
        return false;
    if(this.dis_from===undefined||this.dis_from===null||this.dis_from==='')
        return false;
    return true;
}

module.exports = Discussions;
