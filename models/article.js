"use strict";

module.exports = function(sequelize, DataTypes) {
    var Article = sequelize.define("Article", {
        idcode: {type:DataTypes.UUID,allowNull: false,primaryKey: true},
        title: {type:DataTypes.TEXT,allowNull: false},
        it_service:{type:DataTypes.ARRAY(DataTypes.TEXT),allowNull: false},
        tag:{type:DataTypes.ARRAY(DataTypes.TEXT)},
        author: {type:DataTypes.TEXT},
        ref_links:{type:DataTypes.ARRAY(DataTypes.TEXT)},
        tasks: {type:DataTypes.TEXT},
        type: {type:DataTypes.ENUM('Free','Guide','Share','Troubleshooting')},
        content: {type:DataTypes.JSONB}
    });
    return Article;
};
