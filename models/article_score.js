var initSql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'article_user_ukey') THEN
    ALTER TABLE "ArticleScores" ADD CONSTRAINT "article_user_ukey" UNIQUE (article_id, user_id);
  END IF;
END 
$$;`

module.exports = function (sequelize, DataTypes) {
    var ArticleScore = sequelize.define("ArticleScore",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true,defaultValue: DataTypes.UUIDV4},
            article_id:{type: DataTypes.UUID, allowNull: false},
            user_id:{type: DataTypes.INTEGER,allowNull: false},
            score:{type: DataTypes.INTEGER, allowNull: true, defaultValue: null,validate: { min: 0, max: 10}},
        });
    ArticleScore.initsql = initSql;
    return ArticleScore;
};