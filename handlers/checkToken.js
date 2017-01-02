const User=require('../sql/User');
let user=new User();

module.exports = (req, res, next) => {
    user.token_validate(req.body.token,function(info){
        if(info){
            req.userid= info.userid;
            return next();
        }
        else
            return next(new Error(res.__('TokenAuthFail')));
    });
};
