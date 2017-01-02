"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var Config = require('../config');
var config = new Config().PG_Connection;
var sequelize;
if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL);
} else {
    sequelize = new Sequelize(config.database, config.user, config.password, {
        host: config.host,
        dialect: 'postgres',
        pool: {
            max: config.max,
            min: 0,
            idle: config.idleTimeoutMillis}
    });
}

var db        = {};

fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

// Object.keys(db).forEach(function(modelName) {
//     if ("associate" in db[modelName]) {
//         db[modelName].associate(db);
//     }
// });

db.sequelize = sequelize;

module.exports = db;
