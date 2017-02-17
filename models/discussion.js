const config = require('config')
var zhparser=config.get('config.postgres.zhparser')

var initsql = `
DO $$ 
        BEGIN
            BEGIN
                ALTER TABLE "Discussions" ADD COLUMN keyword TSVECTOR;
            EXCEPTION
                WHEN duplicate_column THEN RAISE NOTICE 'column keyword already exists in Discussions.';
            END;
        END;
  $$;

CREATE INDEX IF NOT EXISTS discussion_search_idx ON "Discussions" USING gin(keyword);

DROP TRIGGER IF EXISTS discussion_vector_update on "Discussions";

CREATE TRIGGER discussion_vector_update BEFORE INSERT OR UPDATE ON "Discussions" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(keyword, 'public.${zhparser}', title,content);

`;

module.exports = function (sequelize, DataTypes) {
    var Discussion = sequelize.define("Discussion",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true,defaultValue: DataTypes.UUIDV4},
            article_id:{type: DataTypes.UUID, allowNull: false},
            from: {type: DataTypes.TEXT, allowNull: false},
            to: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            reply_id:{type: DataTypes.UUID},
            type: {type: DataTypes.ENUM('topic', 'reply')},
            content: {type: DataTypes.TEXT},
            title: {type: DataTypes.TEXT},
            migrate:{type:DataTypes.BOOLEAN,defaultValue:false}
        });
    Discussion.initsql = initsql;
    return Discussion;
};