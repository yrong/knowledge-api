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

UPDATE "Discussions" SET keyword = to_tsvector('knowledge_zhcfg', coalesce(title,'') || ' ' || coalesce(content,''));

CREATE INDEX IF NOT EXISTS discussion_search_idx ON "Discussions" USING gin(keyword);

DROP TRIGGER IF EXISTS discussion_vector_update on "Discussions";

CREATE TRIGGER discussion_vector_update BEFORE INSERT OR UPDATE ON "Discussions" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger(keyword, 'public.knowledge_zhcfg', title,content);

DO $$ 
        BEGIN
            BEGIN
                ALTER TABLE "Discussions" ADD COLUMN "migrate" BOOLEAN DEFAULT FALSE;
            EXCEPTION
                WHEN duplicate_column THEN RAISE NOTICE 'column migrate already exists in Discussions.';
            END;
        END;
  $$;

`;

module.exports = function (sequelize, DataTypes) {
    var Discussion = sequelize.define("Discussion",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true},
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