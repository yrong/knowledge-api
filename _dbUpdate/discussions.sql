CREATE TABLE public.discussions
(
  id serial NOT NULL, -- 自增主键
  idcode uuid NOT NULL, -- 文章idcode
  created_at timestamp without time zone, -- 评论时间
  dis_from text NOT NULL, -- 评论者
  dis_to text[], -- 被@者
  content text, -- 评论内容
  title text,
  dis_idcode uuid, -- 评论唯一识别码
  dis_type text, -- 评论类型
  dis_reply_idcode uuid, -- 评论的topic的id
  CONSTRAINT discussions_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.discussions
  OWNER TO postgres;
COMMENT ON TABLE public.discussions
  IS '文章评论';
COMMENT ON COLUMN public.discussions.id IS '自增主键';
COMMENT ON COLUMN public.discussions.idcode IS '文章idcode';
COMMENT ON COLUMN public.discussions.created_at IS '评论时间';
COMMENT ON COLUMN public.discussions.dis_from IS '评论者';
COMMENT ON COLUMN public.discussions.dis_to IS '被@者';
COMMENT ON COLUMN public.discussions.content IS '评论内容';
COMMENT ON COLUMN public.discussions.dis_idcode IS '评论唯一识别码';
COMMENT ON COLUMN public.discussions.dis_type IS '评论类型';
COMMENT ON COLUMN public.discussions.dis_reply_idcode IS '评论的topic的id';


-- Index: public.idx_discussions_idcode

-- DROP INDEX public.idx_discussions_idcode;

CREATE INDEX idx_discussions_idcode
  ON public.discussions
  USING btree
  (idcode);



CREATE OR REPLACE FUNCTION discussions_insert() 
RETURNS TRIGGER AS $body$
    BEGIN
        IF (TG_OP = 'INSERT') THEN
            if(NEW.dis_type='topic') then
				NEW.dis_reply_idcode:=NEW.dis_idcode;
				update discussions set dis_reply_idcode=NEW.dis_idcode where dis_idcode=NEW.dis_idcode;
			end if;
            RETURN NEW;
        END IF;
        RETURN NULL;
    END;
$body$ LANGUAGE plpgsql;

CREATE TRIGGER discussions_TRIGGER AFTER INSERT ON discussions FOR EACH ROW EXECUTE PROCEDURE discussions_insert();