alter table discussions add column dis_idcode uuid not null;
alter table discussions add column dis_type text;
alter table discussions add column dis_reply_idcode uuid;

COMMENT ON COLUMN public.discussions.dis_idcode
    IS '评论唯一识别码';
COMMENT ON COLUMN public.discussions.dis_type 
    IS '评论类型';
COMMENT ON COLUMN public.discussions.dis_reply_idcode
    IS '评论的topic的id';
	
	
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