var express = require('express');
var Client=require('pg').Client;
var Config = require('../config');
var User=require('../sql/User');
var UserInfo = require('../model/UserInfo');
var fs = require('fs');
var path = require('path');
var formidable = require('formidable');

var config=new Config();
var pg_config=config.PG_Connection;//pg的连接参数
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
    //解析其他字段
    var headimagepath='headImages/'+fields.userid+'.png';//头像路径保存地址
    var userinfo=new UserInfo({
      userid:fields.userid,//用户id
      headimage:headimagepath,
      per_page:fields.per_page//分页设置
    });
    var local_headimagepath=path.join('public',path.normalize(headimagepath));//服务器磁盘存储路径
    var is = fs.createReadStream(files.headimage.path);
    var os = fs.createWriteStream(local_headimagepath);
    is.pipe(os);
    is.on('end', function () {
      fs.unlinkSync(files.headimage.path, local_headimagepath);
    });
    var client = new Client(pg_config);
    client.connect();
    let query = client.query("insert into userinfo(userid,headimage,per_page) VALUES ($1,$2,$3)",[userinfo.userid,userinfo.headimage,userinfo.per_page],function(err, result){
      if(err)
        res.send({status:'新增发生异常错误'});
      else
        res.send({status:'ok',data:userinfo});
      client.end();
    });
  });
});
//修改用户设置
router.put('/userinfo/:userid', function(req, res, next) {
  var userid = req.params.userid;
  if (userid == undefined) {
    res.send({status: '未指定更新用户！'});
    return;
  }
  var form = new formidable.IncomingForm();
  form.parse(req, function(error, fields, files) {
    var userinfo=new UserInfo();
    //解析其他字段
    if(files.headimage.path!==undefined){
      var headimagepath='headImages/'+fields.userid+'.png';//头像路径保存地址
      userinfo.headimage=headimagepath;
      var local_headimagepath=path.join('public',path.normalize(headimagepath));//服务器磁盘存储路径
      var is = fs.createReadStream(files.headimage.path);
      var os = fs.createWriteStream(local_headimagepath);
      is.pipe(os);
      is.on('end', function () {
        fs.unlinkSync(files.headimage.path, local_headimagepath);
      });
    }
    if(fields.per_page!==undefined)
        userinfo.per_page=fields.per_page;
    var items=[];
    for(let key in userinfo){
      if(typeof userinfo[key]=='string')
        items.push(util.format("%s='%s'",key,userinfo[key]));
      else if(typeof userinfo[key]=='number'||typeof userinfo[key]=='boolean')
        items.push(util.format('%s=%s',key,userinfo[key]));
    }
    let sql=util.format("update userinfo set %s where userid=$1",items.join(','));
    let query = client.query(sql,[userid],function(err, result) {
      if(err)
        res.send({status:'更改设置发生异常错误'});
      else{
        userinfo.userid=userid;
        res.send({status:'ok',data:userinfo});
      }
      client.end();
    });
  });
});
//获取用设置
router.get('/userinfo/:userid', function(req, res, next) {
  var userid = req.params.userid;
  if (userid == undefined) {
    res.send({status: '未指定查询参数！'});
    return;
  }
  var client = new Client(pg_config);
  try {
    client.connect();
  }
  catch (e) {
    res.send({status: '数据库连接错误'});
    return;
  }
  let sql = util.format("select * from userinfo where userid=$1");
  query = client.query(sql, [userid], function (err, result) {
    if (err)
      res.send({status: '查询错误！'});
    else {
      var row = result.rows[0];
      if (row == undefined)
        res.send({status: '查询成功，未查询到用户设置信息！'});
      else
        res.send({status: 'ok', data: row});
    }
    client.end();
  });
});
module.exports = router;
