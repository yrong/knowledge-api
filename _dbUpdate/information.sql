CREATE TABLE public.notifications
(
  id serial NOT NULL, -- 自增主键
  userid text NOT NULL, -- 用户id
  created_at timestamp without time zone, -- 操作发生时间
  action text, -- 操作类型
  targetid text, -- 操作文章或回复的idcode
  relationid text, -- 操作关联文章或回复的idcode
  CONSTRAINT information_peky PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.notifications
  OWNER TO postgres;
COMMENT ON COLUMN public.notifications.id IS '自增主键';
COMMENT ON COLUMN public.notifications.userid IS '用户id';
COMMENT ON COLUMN public.notifications.created_at IS '操作发生时间';
COMMENT ON COLUMN public.notifications.action IS '操作类型';
COMMENT ON COLUMN public.notifications.targetid IS '操作文章或回复的idcode';
COMMENT ON COLUMN public.notifications.relationid IS '操作关联文章或回复的idcode';


CREATE INDEX notifications_relationid_idx
  ON public.notifications
  USING btree
  (relationid);


CREATE INDEX notifications_targetid_idx
  ON public.notifications
  USING btree
  (targetid);
