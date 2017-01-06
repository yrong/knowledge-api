"use strict";

var create_article_history_table_sql = `CREATE TABLE IF NOT EXISTS "Articles_History" AS
select * from "Articles"
WITH NO DATA
`;

var article_trigger_function_sql = `CREATE OR REPLACE FUNCTION process_article() RETURNS TRIGGER AS $body$
    BEGIN
        IF (TG_OP = 'UPDATE' or TG_OP = 'INSERT') THEN
            INSERT INTO "Articles_History" values (NEW.idcode, NEW.title, NEW.it_service, NEW.tag, NEW.author, 
            NEW.ref_links, NEW.tasks, NEW.type, NEW.content,
            NEW."createdAt", NEW."updatedAt");
            RETURN NEW;
        END IF;
        RETURN NULL;
    END;
$body$ LANGUAGE plpgsql;`;

var article_trigger_sql = `DROP TRIGGER IF EXISTS trigger_article on "Articles";
CREATE TRIGGER trigger_article
AFTER INSERT OR UPDATE ON "Articles"
    FOR EACH ROW EXECUTE PROCEDURE process_article();`;

var article_fulltext_index_sql = `CREATE INDEX IF NOT EXISTS article_index ON "Articles" USING gin (to_tsvector('knowledge_zhcfg', (title || ' '::text) || content));`

module.exports = function (sequelize, DataTypes) {
    var Article = sequelize.define("Article",
        {
            idcode: {type: DataTypes.UUID, allowNull: false, primaryKey: true},
            title: {type: DataTypes.TEXT, allowNull: false},
            it_service: {type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false},
            tag: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            author: {type: DataTypes.TEXT},
            ref_links: {type: DataTypes.ARRAY(DataTypes.TEXT)},
            tasks: {type: DataTypes.TEXT},
            type: {type: DataTypes.ENUM('Free', 'Guide', 'Share', 'Troubleshooting')},
            content: {type: DataTypes.JSONB}
        },
        {
            classMethods: {
                dbInit: function () {
                    sequelize.query(create_article_history_table_sql)
                        .then(function () {
                            return sequelize.query(article_trigger_function_sql);
                        })
                        .then(function () {
                        return sequelize.query(article_trigger_sql);
                        })
                        .then(function () {
                            return sequelize.query(article_fulltext_index_sql);
                        })
                        .catch(console.log);
                }
            }
        });
    return Article;
};
