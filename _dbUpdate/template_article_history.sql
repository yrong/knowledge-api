CREATE TABLE template_article_history
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
  CONSTRAINT template_article_history_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE template_article_history
  OWNER TO postgres;
COMMENT ON TABLE public.template_article_history
  IS '文章母版';
COMMENT ON COLUMN public.template_article_history.id IS '自增主键';
COMMENT ON COLUMN public.template_article_history.idcode IS 'uuid全局唯一码';
COMMENT ON COLUMN public.template_article_history.title IS '文章标题';
COMMENT ON COLUMN public.template_article_history.it_service IS 'it_service标签';
COMMENT ON COLUMN public.template_article_history.tag IS '用户自定义标签';
COMMENT ON COLUMN public.template_article_history.author IS '作者';
COMMENT ON COLUMN public.template_article_history.created_at IS '创建时间';
COMMENT ON COLUMN public.template_article_history.updated_at IS '更新时间';
COMMENT ON COLUMN public.template_article_history.ref_links IS '参考链接';
COMMENT ON COLUMN public.template_article_history.tasks IS '关联任务';