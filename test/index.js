
const newman = require('newman');
const assert = require('chai').assert;
const fs = require('fs');

describe("Kb-api Integration test suite", function() {
    this.timeout(15000)

    it('new api', function(done) {
        newman.run({
            collection: require('./kb-api.postman_collection.json'),
            environment: JSON.parse(fs.readFileSync(process.env['ENVIRONMENT_FILE'], 'utf8')),
            reporters: 'cli'
        }, function (err) {
            if (err) { done(err)}
            console.log('new api run complete!');
            done();
        });
    });
})