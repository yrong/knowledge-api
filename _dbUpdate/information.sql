create table notifications(
	id serial not null,
	userid text not null,
	created_at timestamp without time zone,
	action text,--增删改
	targetid text,
	relationid text,
	constraint information_peky primary key (id)
);
create index notifications_targetid_idx on notifications using btree(targetid);
create index notifications_relationid_idx on notifications using btree(relationid);
COMMENT ON COLUMN notifications.id
    IS '自增主键';
COMMENT ON COLUMN notifications.userid 
    IS '用户id';
COMMENT ON COLUMN notifications.created_at
    IS '操作发生时间';
COMMENT ON COLUMN notifications.action
    IS '操作类型';
COMMENT ON COLUMN notifications.targetid
    IS '操作文章或回复的idcode';
COMMENT ON COLUMN notifications.relationid
    IS '操作关联文章或回复的idcode';