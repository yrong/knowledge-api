module.exports = function (sequelize, DataTypes) {
    var ArticleHistory = sequelize.define("ArticleHistory",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true,defaultValue: DataTypes.UUIDV4},
            article_id:{type: DataTypes.UUID, allowNull: false},
            user_id:{type: DataTypes.INTEGER,allowNull: false},
            action:{type: DataTypes.STRING, allowNull: false},
            original_data:{type: DataTypes.JSONB},
            new_data:{type: DataTypes.JSONB},
            update_data:{type: DataTypes.JSONB}
        });
    return ArticleHistory;
};