const User=require('../sql/User');
let user=new User();

module.exports = (req, res, next) => {
    var token = req.body.token?req.body.token:req.cookies.token;
    user.token_validate(token,function(info){
        if(info){
            req.userid= info.userid;
            // req.userRole = 'admin';
            return next();
        }
        else
            return next(new Error('token invalid'));
    });
};
