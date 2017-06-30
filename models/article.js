const config = require('config')
var zhparser=config.get('postgres.zhparser')

var initSql = `

DO $$ 
        BEGIN
            BEGIN
                ALTER TABLE "Articles" ADD COLUMN "keyword" TSVECTOR;                
            EXCEPTION
                WHEN duplicate_column THEN RAISE NOTICE 'column keyword already exists in Articles.';
            END;
        END;
  $$;  

CREATE INDEX IF NOT EXISTS article_search_idx ON "Articles" USING gin(keyword);

CREATE OR REPLACE FUNCTION article_vector_trigger() RETURNS trigger AS $$
begin
  new.keyword :=
     setweight(to_tsvector('public.${zhparser}', coalesce(new.title,'')), 'A') ||
     setweight(to_tsvector('public.${zhparser}', to_json(new.content::TEXT)::TEXT), 'D');
  return new;
end
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS article_vector_update on "Articles";

CREATE TRIGGER article_vector_update BEFORE INSERT OR UPDATE ON "Articles" FOR EACH ROW EXECUTE PROCEDURE article_vector_trigger();


DO $$ 
        BEGIN
            BEGIN
                ALTER TABLE "Articles" ADD COLUMN "discussion_count" INTEGER DEFAULT 0;                
            EXCEPTION
                WHEN duplicate_column THEN RAISE NOTICE 'column "discussion_count" already exists in Articles.';
            END;
        END;
  $$; 
  
DO $$ 
        BEGIN   
            UPDATE "Articles" set discussion_count = article_discussion_count.cnt from 
            (select article_id,count(*) as cnt from "Discussions" group by article_id) as article_discussion_count         
            WHERE  "Articles".uuid=article_discussion_count.article_id; 
        END;
$$;

DO $$ 
        BEGIN
            BEGIN
                ALTER TABLE "Articles" ADD COLUMN "attachment" jsonb[];                
            EXCEPTION
                WHEN duplicate_column THEN RAISE NOTICE 'column "attachment" already exists in Articles.';
            END;
        END;
  $$;   
  
`


module.exports = function (sequelize, DataTypes) {
    var Article = sequelize.define("Article",
        {
            uuid: {type: DataTypes.UUID, allowNull: false, primaryKey: true,defaultValue: DataTypes.UUIDV4},
            title: {type: DataTypes.TEXT, allowNull: false},
            it_service: {type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false},
            tag: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            author: {type: DataTypes.TEXT},
            ref_links: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            tasks: {type: DataTypes.TEXT},
            type: {type: DataTypes.ENUM('Free', 'Guide', 'Share', 'Troubleshooting')},
            content: {type: DataTypes.JSONB},
            migrate:{type: DataTypes.BOOLEAN,defaultValue:false},
            discussion_count:{type:DataTypes.INTEGER,defaultValue:0},
            attachment:{type: DataTypes.ARRAY(DataTypes.JSONB)}
        });
    Article.initsql = initSql;
    Article.trace_history = true
    return Article;
};
