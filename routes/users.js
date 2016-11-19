var express = require('express');
var User=require('../sql/User');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
//更改用户密码
var user=new User();
router.put('/changepwd', function(req, res, next) {
  var userid=req.params.userid;
  var alias=req.params.alias;
  var oldpwd=req.params.oldpwd;
  var newpwd=req.params.newpwd;
  user.changepwd(userid,alias,oldpwd,newpwd,function(info){
    if(info)
      res.send({status:'修改密码失败'});
    else
      res.send({status:'ok'});
  });
});


module.exports = router;
