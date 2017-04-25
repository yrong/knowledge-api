var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var fs = require('fs');

var routes_new = require('./routes/index');
var responseSender = require('./helper/responseSender')

var log4js = require('log4js');
var config = require('config');
const appDir = path.resolve(__dirname, '.')
const logDir = path.join(appDir, 'logs')
const logger_config = config.get('config.logger')
log4js.configure(logger_config, { cwd: logDir })
var logger = require('./logger');

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(log4js.connectLogger(logger, {level:logger_config.defaultLevel,format:':method :url :status :response-time'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//设置跨域访问
var cors = require('cors')
app.use(cors())

const token_check_url = config.get('config.auth.base_url')+config.get('config.auth.token_check_path')
const token_name = config.get('config.auth.token_name')
const check_token = require('./middleware/check_token')
app.use(check_token(token_check_url,token_name))

var models = require('./models');
models.sequelize.sync().then(function(){
    models.dbInit();
})
routes_new.route_init(app);


// error handlers

app.use(function (err, req, res, next) {
    logger.error(String(err));
    responseSender(req,res,err)
});


//定时任务，清除临时文件
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0,new schedule.Range(1, 6)];
rule.hour = 23;
rule.minute = 59;
schedule.scheduleJob(rule, function(){
  let files = [];
  let _path='temp';
  deleteFolderRecursive(_path);
});
var deleteFolderRecursive = function(path) {
  var files = [];
  if( fs.existsSync(path) ) {
    files = fs.readdirSync(path);
    files.forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};
module.exports = app;
