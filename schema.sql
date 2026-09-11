create table if not exists todos (
    id integer primary key,
    title text not null,
    content text,
    due_date date,
    done integer default 0
);