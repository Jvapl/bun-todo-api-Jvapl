create table if not exists todos (
    id integer primary key,
    title text not null,
    content text | null,
    due_date date | null,
    done integer default 0
);