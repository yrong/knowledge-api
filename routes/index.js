var express = require('express');
var exec = require('child_process').exec;
var util=require('util');
var uuid=require('node-uuid');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/printpdf', function(req, res, next) {
  var pdfUrl = req.query.url;
  var pdfpath = path.normalize(util.format('temp/%s.pdf', uuid.v4()));
  var rasterize=path.normalize('bin/rasterize.js');
  //var _path=util.format("phantomjs %s %s %s A4", rasterize,pdfUrl, pdfpath);
  var _path=util.format("phantomjs %s %s %s 800*600px", rasterize,pdfUrl, pdfpath);
  exec(_path, function (error, stdout, stderr) {
    if (error || stderr) {
      console.log(error);
      res.send(500, error || stderr);
      return;
    }
    res.set('Content-Type', 'application/pdf');
    res.download(pdfpath);
  });

});


module.exports = router;
