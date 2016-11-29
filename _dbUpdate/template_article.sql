CREATE TABLE public.template_article
(
  id serial NOT NULL, -- 自增主键
  idcode uuid NOT NULL, -- uuid全局唯一码
  title text NOT NULL, -- 文章标题
  it_service text[] NOT NULL, -- it_service标签
  tag text[], -- 用户自定义标签
  author text, -- 作者
  created_at timestamp without time zone, -- 创建时间
  updated_at timestamp without time zone, -- 更新时间
  ref_links text[], -- 参考链接
  tasks text, -- 关联任务
  article_type text,
  content jsonb,
  CONSTRAINT template_article_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.template_article
  OWNER TO postgres;
COMMENT ON TABLE public.template_article
  IS '文章母版';
COMMENT ON COLUMN public.template_article.id IS '自增主键';
COMMENT ON COLUMN public.template_article.idcode IS 'uuid全局唯一码';
COMMENT ON COLUMN public.template_article.title IS '文章标题';
COMMENT ON COLUMN public.template_article.it_service IS 'it_service标签';
COMMENT ON COLUMN public.template_article.tag IS '用户自定义标签';
COMMENT ON COLUMN public.template_article.author IS '作者';
COMMENT ON COLUMN public.template_article.created_at IS '创建时间';
COMMENT ON COLUMN public.template_article.updated_at IS '更新时间';
COMMENT ON COLUMN public.template_article.ref_links IS '参考链接';
COMMENT ON COLUMN public.template_article.tasks IS '关联任务';


-- Index: public.template_article_idcode_idx

-- DROP INDEX public.template_article_idcode_idx;

CREATE INDEX template_article_idcode_idx
  ON public.template_article
  USING btree
  (idcode);

-- Index: public.template_article_index

-- DROP INDEX public.template_article_index;

CREATE INDEX template_article_index
  ON public.template_article
  USING rum
  (to_tsvector('knowledge_zhcfg'::regconfig, (title || ' '::text) || content) rum_tsvector_ops);

