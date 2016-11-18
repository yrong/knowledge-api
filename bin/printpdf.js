var fs = require("fs");


var casper = require('casper').create({ 
     verbose: true, 
     logLevel: 'debug',
     pageSettings: {
         loadImages: true, 
         loadPlugins: true, 
         userAgent: 'Mozilla/5.0 (Windows NT 6.1; rv:17.0) Gecko/20100101 Firefox/17.0'
     }
}); 
//var address = "http://111.203.239.111:3001/#!/articles/af3c22b5-dad3-4722-8b59-3f65cf3e015d?mode=read";

var address = casper.cli.args[0];
var output = casper.cli.args[1];
casper.echo(address);
casper.echo(output);
//output="output.pdf";
var username = "demo";
var password = "demo";
casper.options.viewportSize = {width: 1000, height: 900};
casper.start(address, function () {
    this.echo('start...');
});

casper.then(function () {
    this.echo("open page ok.");
});

//查询文章页面的内容是否存在
casper.waitForSelector("div.articles-content", 
		function success() {
			//等待5s让它去登录，然后再输出pdf
			this.wait(5 * 1000, function () {
				casper.capture(output);
			});
		},
		function fail() {
			this.echo('未发现文章页面，需要登录！');
			//模拟登录去爬取页面
			casper.waitForSelector("div.form-group input[placeholder='用户名']",
				function success() {
				this.echo('waitForSelector success 1');
				/*
				其实用这个更简单， 但是它的页面有js做键盘输入校验，所以这里不用了。
				this.fillSelectors("div.login-box-body", {
				"input[type='text']": username,
				"input[type='password']": password,
				}, false);
				 */

				this.sendKeys("div.login-box-body input[type='text']", username);
				this.sendKeys("div.login-box-body input[type='password']", password);

				var x = this.evaluate(function () {
						$("button").removeAttr('disabled') //移除vue.js的校验更方便
						return ($("button").attr('disabled'));
					});
				console.log("disabled button?", x);
				this.click("button");

				//等待5s让它去登录，然后再输出pdf
				this.wait(5 * 1000, function () {
					casper.capture(output);
				});
			},
				function fail() {
				this.echo('waitForSelector fail 2');
				this.echo('有可能是已经成功过&&还没退出，所以不需重复登录');
				casper.capture(output);
			});
		}
);



casper.log(username);
casper.log(password);
casper.run();
