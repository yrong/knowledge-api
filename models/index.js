"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize-fulltext-search");
var config = require('config');
var logger = require('../logger');
var pg_config = config.get('config.postgres')
var sequelize = new Sequelize(pg_config.database, pg_config.user, pg_config.password, {
    host: pg_config.host,
    dialect: 'postgres',
    pool: {
        max: pg_config.max,
        min: 0,
        idle: pg_config.idleTimeoutMillis
    },
    logging: logger.debug.bind(logger),
    regconfig:pg_config.zhparser
});

var db  = {};

fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
    });

db.sequelize = sequelize;

db.dbInit = function(){
    Object.keys(db).forEach(function(modelName) {
        if (db[modelName].initsql) {
            db.sequelize.query(db[modelName].initsql).catch(logger.error);
        }
    });
}
module.exports = db;
