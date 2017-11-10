const config = require('config')
var zhparser=config.get('postgres-kb.zhparser')

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

CREATE OR REPLACE FUNCTION update_article_discussion_count() RETURNS TRIGGER AS $body$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            UPDATE "Articles" set discussion_count = discussion_count + 1 WHERE uuid= NEW.article_id;       
        ELSIF (TG_OP = 'DELETE') THEN
			UPDATE "Articles" set discussion_count = discussion_count - 1 WHERE uuid= OLD.article_id; 
        END IF;
        RETURN NULL;
    END;
$body$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_article_discussion_count_trigger on "Discussions";

CREATE TRIGGER update_article_discussion_count_trigger AFTER INSERT OR DELETE ON "Discussions" FOR EACH ROW
EXECUTE PROCEDURE update_article_discussion_count();
 
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
    Discussion.trace_history = true
    return Discussion;
};