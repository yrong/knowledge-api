var express = require('express');
var child_process = require('child_process')
var exec = child_process.exec;
var util=require('util');
var uuid=require('node-uuid');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/printpdf', function(req, res, next) {
  var pageUrl = req.query.url;
  var pdfoutpath = path.normalize(util.format('temp/%s.pdf', uuid.v4()));
  var printpdfjs=path.normalize('bin/printpdf.js');
  var _path=util.format('casperjs %s %s %s', printpdfjs,pageUrl, pdfoutpath);
  exec(_path, function (error, stdout, stderr) {
    res.set('Content-Type', 'application/pdf');
    if (error || stderr) {
      console.log(error);
      res.send(500, error || stderr);
      res.download(pdfoutpath);
      return;
    }
    //res.set('Content-Type', 'application/pdf');
    res.download(pdfoutpath);
  });

});


module.exports = router;
