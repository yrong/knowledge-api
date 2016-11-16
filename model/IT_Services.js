var IT_Services=function(options){
    for(var key in options) {
        if(key=='id')
            this.id=options[key];
        if(key=='category')
            this.tag=options[key];
        if(key=='service_name')
            this.title=options[key];
        if(key=='priority')
            this.it_service=options[key];
        if(key=='responsibility')
            this.author=options[key];
    }
}
IT_Services.prototype.validate=function(){
    if(this.category===undefined||this.category===null||this.category==='')
        return false;
    if(this.service_name===undefined||this.service_name===null||this.service_name==='')
        return false;
    if(this.priority===undefined||this.priority===null||this.priority==='')
        return false;
    return true;
}
module.exports = IT_Services;
