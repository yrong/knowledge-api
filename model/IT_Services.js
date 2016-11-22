var IT_Services=function(options){
    for(var key in options) {
        if(key=='id')
            this.id=options[key];
        if(key=='idcode')
            this.idcode=options[key];
        if(key=='name')
            this.name=options[key];
        if(key=='dependency[]'){
            if(typeof options['dependency[]']=='string')
                this.dependency=[options['dependency[]']];
            else if(typeof options['dependency[]']=='object')
                this.dependency=options['dependency[]'];
        }
        if(key=='path')
            this.path=options[key];
    }
}
module.exports = IT_Services;
