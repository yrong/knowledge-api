create table userinfo(
	id serial not null,
	userid int not null,
	headimage text,
	per_page int,
	constraint userinfo_peky primary key (id)
);
create index idx_userinfo_userid on userinfo using btree(userid);
COMMENT ON COLUMN userinfo.id
    IS '自增主键';
COMMENT ON COLUMN userinfo.userid 
    IS '用户id';
COMMENT ON COLUMN userinfo.headimage
    IS '用户头像相对路径';
COMMENT ON COLUMN userinfo.per_page
    IS '用户分页设置(每页几篇文章)';	
	