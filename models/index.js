"use strict";

const fs        = require("fs");
const path      = require("path");
const Sequelize = require("sequelize-fulltext-search");
const config = require('config');
const Log = require('log4js_wrapper')
const logger = Log.getLogger()
const pg_config = config.get('postgres')
const sequelize = new Sequelize(pg_config.database, pg_config.user, pg_config.password, {
    host: pg_config.host,
    port: pg_config.port,
    dialect: 'postgres',
    pool: {
        max: pg_config.max,
        min: 0,
        idle: pg_config.idleTimeoutMillis
    },
    logging: logger.debug.bind(logger),
    regconfig:pg_config.zhparser
});

let db  = {};

fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js");
    })
    .forEach(function(file) {
        var model = sequelize.import(path.join(__dirname, file));
        db[model.name] = model;
        if(db[model.name].trace_history) {
            db[`${model.name}History`] = sequelize.define(`${model.name}History`,
                {
                    uuid: {type: Sequelize.UUID, allowNull: false, primaryKey: true,defaultValue: Sequelize.UUIDV4},
                    user_id:{type: Sequelize.INTEGER,allowNull: false},
                    action:{type: Sequelize.STRING, allowNull: false},
                    old:{type: Sequelize.JSONB},
                    new:{type: Sequelize.JSONB},
                    update:{type: Sequelize.JSONB},
                    status:{type: Sequelize.INTEGER,allowNull: false,defaultValue:0}
                }
            )
        }
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
