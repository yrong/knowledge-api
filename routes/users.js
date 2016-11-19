var express = require('express');
var User=require('../sql/User');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
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
//上传头像，设置分页等提交的form表单
router.post('/userinfo', function(req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function(error, fields, files) {
    console.log("parsing done");
    console.log(fields);
    console.log(files.headimage.path);
    //解析其他字段
    var userid=fields.userid;
    var per_page=fields.per_page;
    var headimagepath=path.normalize('upload/'+userid+'.png');
    fs.renameSync(files.headimage.path, headimagepath); //上传的图片另存为
    //插入数据库记录
    res.send({status:'ok'});

  });
});

module.exports = router;
