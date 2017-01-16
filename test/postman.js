var newman = require('newman'); // require newman in your project

// call newman.run to pass `options` object and wait for callback
newman.run({
    collection: require('./kb-api.postman_collection.json'),
    environment: require('./kb.postman_environment.json'),
    reporters: 'cli'
}, function (err) {
    if (err) { throw err; }
    console.log('kb-api run complete!');
});

newman.run({
    collection: require('./kb-api-v1.postman_collection.json'),
    environment: require('./kb.postman_environment.json'),
    reporters: 'cli'
}, function (err) {
    if (err) { throw err; }
    console.log('kb-api v1 run complete!');
});