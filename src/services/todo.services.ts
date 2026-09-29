import { db } from "../db";
import type { toCreateTodo, Todo } from "../schemas/todo.schema";

// === Requests ===

export const getTodos = async () => {
    return await db.query("select * from todos").all();
}

export const createTodo = async (todo: toCreateTodo) => {
    const { lastInsertRowid } = db.query(
        `insert into todos (title, content, due_date, done)
        values ($title, $content, $due_date, $done)`
    ).run({
        $title: todo.title,
        $content: todo.content,
        $due_date: todo.due_date ?? null,
        $done: todo.done,
    });

    return db.query("select * from todos where id = ?").get(lastInsertRowid);
}

export const patchTodo = (id: number, patch: Partial<toCreateTodo>) => {
    const existing = db.query("select * from todos where id = $id").get({ $id: id }) as Todo | null
    if (!existing) return null

    const merged = { ...existing, ...patch }

    db.query(`
        update todos
        set title = $title, content = $content, due_date = $due_date, done = $done
        where id = $id`
    ).run({
        $id: id,
        $title: merged.title,
        $content: merged.content,
        $due_date: merged.due_date ?? null,
        $done: merged.done,
    })

    return db.query("select * from todos where id = ?").get(id)
}

// body : unknown its the function doesn't know what he's going to get that's why unknown
// safeParse : take what I did with object

export const deleteTodo = async (id: number): Promise<{ changes: number, lastInsertRowid: number | bigint }> => {
    const result: { changes: number, lastInsertRowid: number | bigint } = db.query(`delete from todos where id = $id`).run({ $id: id })
    return result
}

export const deleteAllTodos = async () => {
    db.query("delete from todos").run()
}