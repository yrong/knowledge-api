module.exports = function (sequelize, DataTypes) {
    var ArticleHistory = sequelize.define("ArticleHistory",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true,defaultValue: DataTypes.UUIDV4},
            article_id:{type: DataTypes.UUID, allowNull: false},
            user_id:{type: DataTypes.INTEGER,allowNull: false},
            action:{type: DataTypes.STRING, allowNull: false},
            old:{type: DataTypes.JSONB},
            new:{type: DataTypes.JSONB},
            update:{type: DataTypes.JSONB},
            status:{type: DataTypes.INTEGER,allowNull: false,defaultValue:0}
        });
    return ArticleHistory;
};