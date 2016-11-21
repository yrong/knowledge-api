var UserInfo= function(options){
    for(var key in options) {
        if (key == 'userid')
            this.userid = options[key];
        if (key == 'headimage')
            this.headimage = options[key];
        if (key == 'per_page')
            this.per_page = options[key];
    }
}

UserInfo.prototype.validate=function(){
    if(this.userid===undefined||this.userid===null||this.userid==='')
        return false;
    return true;
}
module.exports = UserInfo;
