CREATE TABLE public.it_services
(
    id serial NOT NULL,
	idcode text,
    name text, -- 名称
	dependency text[], -- 服务依赖
	path ltree, -- 服务层级维护
    CONSTRAINT it_services_pkey PRIMARY KEY (id)
);
CREATE INDEX it_services_idcode_idx ON public.it_services USING btree (idcode);

CREATE INDEX it_services_path_gist_idx ON public.it_services USING gist (path);

COMMENT ON COLUMN it_services.id
    IS '自增主键';
COMMENT ON COLUMN it_services.idcode 
    IS '唯一识别码';
COMMENT ON COLUMN it_services.name
    IS '名称';
COMMENT ON COLUMN it_services.dependency
    IS '服务依赖';	
COMMENT ON COLUMN it_services.path
    IS '服务层级维护';