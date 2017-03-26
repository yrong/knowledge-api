require("babel-core/register")
require("babel-polyfill")

var newman = require('newman');
var assert = require('chai').assert;
var migrate = require('../migrate');
describe("Kb-api Integration test suite", function() {
    this.timeout(15000)

    it('new api', function(done) {
        newman.run({
            collection: require('./kb-api-v1.postman_collection.json'),
            environment: require('./knowledge.postman_environment.json'),
            reporters: 'cli'
        }, function (err) {
            if (err) { done(err)}
            console.log('new api run complete!');
            done();
        });
    });

    it('migrate db from legacy tables', function(done) {
        console.time('kb-api-db-migrate')
        migrate().then((result) => {
            console.timeEnd('kb-api-db-migrate')
            console.log(JSON.stringify(result, null, '\t'))
            done();
        }).catch((err) => {
            console.log(err)
            done();
        })
    });
})