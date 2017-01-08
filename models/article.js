"use strict";

var initSql = `

DO $$ 
        BEGIN
            BEGIN
                ALTER TABLE "Articles" ADD COLUMN keyword TSVECTOR;
            EXCEPTION
                WHEN duplicate_column THEN RAISE NOTICE 'column keyword already exists in Articles.';
            END;
        END;
  $$;

UPDATE "Articles" SET keyword = to_tsvector('knowledge_zhcfg', coalesce(title,'') || ' ' || content);

CREATE INDEX IF NOT EXISTS article_search_idx ON "Articles" USING gin(keyword);

CREATE OR REPLACE FUNCTION article_vector_trigger() RETURNS trigger AS $$
begin
  new.keyword :=
     setweight(to_tsvector('public.knowledge_zhcfg', coalesce(new.title,'')), 'A') ||
     setweight(to_tsvector('public.knowledge_zhcfg', to_json(new.content::TEXT)::TEXT), 'D');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_vector_update on "Articles";

CREATE TRIGGER article_vector_update BEFORE INSERT OR UPDATE ON "Articles" FOR EACH ROW EXECUTE PROCEDURE article_vector_trigger();

CREATE TABLE IF NOT EXISTS "Articles_History" AS
select * from "Articles"
WITH NO DATA;

CREATE OR REPLACE FUNCTION process_article() RETURNS TRIGGER AS $body$
    BEGIN
        IF (TG_OP = 'UPDATE' or TG_OP = 'INSERT') THEN
            INSERT INTO "Articles_History" values (NEW.*);
            RETURN NEW;
        END IF;
        RETURN NULL;
    END;
$body$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_article on "Articles";
CREATE TRIGGER trigger_article AFTER INSERT OR UPDATE ON "Articles" FOR EACH ROW EXECUTE PROCEDURE process_article();

`

module.exports = function (sequelize, DataTypes) {
    var Article = sequelize.define("Article",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true},
            title: {type: DataTypes.TEXT, allowNull: false},
            it_service: {type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false},
            tag: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            author: {type: DataTypes.TEXT},
            ref_links: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            tasks: {type: DataTypes.TEXT},
            type: {type: DataTypes.ENUM('Free', 'Guide', 'Share', 'Troubleshooting')},
            content: {type: DataTypes.JSONB}
        });
    Article.initsql = initSql;
    return Article;
};
