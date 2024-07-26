```sql
create table
  public.base_configurations (
    id bigint generated always as identity,
    config_key text not null,
    config_value text not null,
    created_at timestamp with time zone null default current_timestamp,
    updated_at timestamp with time zone null default current_timestamp,
    constraint base_configurations_pkey primary key (id),
    constraint base_configurations_config_key_key unique (config_key)
  ) tablespace pg_default;
```
```sql
create table
  public.custom_endpoints (
    id serial,
    path character varying(255) not null,
    method character varying(10) not null,
    model character varying(255) not null,
    prompt_template text not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint custom_endpoints_pkey primary key (id),
    constraint custom_endpoints_path_key unique (path)
  ) tablespace pg_default;
  ```
```sql
create table
  public.logs (
    id serial,
    prompt text not null,
    response text not null,
    model character varying(255) not null,
    created_at timestamp without time zone null default current_timestamp,
    constraint logs_pkey primary key (id)
  ) tablespace pg_default;```