import { Database } from "bun:sqlite";
import * as v from "valibot"

// === Valibot ===

export const todoSchema = v.object({
    id: v.number(),
    title: v.pipe(v.string(), v.trim(), v.nonEmpty("Can't be empty")),
    content: v.nullish(v.string(), null),
    due_date: v.pipe(v.string(), v.transform((str: string) => new Date(str)), v.date()),
    done: v.boolean()
})

export type Todo = v.InferOutput<typeof todoSchema>;

// v.object create an object that let me rule sending data
// v.InferOutput<typeof todoSchema> create a "real type" usable for typeScript.
// v.transform changes type from string to date here.
// my v.toMinValue is to check if the current date is on the past.

// === DB ===

const db = new Database('mydb.sqlite')

const schema = await Bun.file("./schema.sql").text()
db.run(schema);

// query = prepare SQL request (doesn't execute)
// get = take first line from this preparation and execute

const table = db
    .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'todos'")
    .get();

if (table) {
    console.log("todos table exists");
} else {
    console.log("todos table does NOT exist");
}

// query = prepare SQL request (doesn't execute)
// get = take first line from this preparation and execute

// === Requests ===

const getTodos = async () => {
    return await db.query("select * from todos").all();
}

const createTodo = async (todo: Todo) => {
    const { lastInsertRowid } = db.query(
        `insert into todos (title, content, due_date, done)
        values ($title, $content, $due_date, $done)`
    ).run({
        $title: todo.title,
        $content: todo.content,
        $due_date: todo.due_date.toISOString(),
        $done: todo.done,
    });

    return db.query("select * from todos where id = ?").get(lastInsertRowid);
}

const pathTodo = async (toUpdateTask: Todo) => {
    const updateTodo = db.prepare(`
            update todos set title = $title, content = $content ,due_date = $date, done = $done where id = $id `)

    updateTodo.run({
        $id: toUpdateTask.id,
        $title: toUpdateTask.title,
        $content: toUpdateTask.content,
        $date: toUpdateTask.due_date.toISOString(),
        $done: toUpdateTask.done,
    })

    return await db.query(`select * from todos where id = ? `).get(toUpdateTask.id)
}

// body : unknown its the function doesn't know what he's going to get that's why unknown
// safeParse : take what I did with object
// db.query(`SELECT * FROM todos WHERE id = ?`).get(lastInsertRowid) :


// === Controllers ===

export const getTodosController = async () => {
    const todos = await getTodos();
    return Response.json(todos);
}

export const postTodosController = async (req: Request) => {
    try {
        const body = await req.json();
        const result = v.safeParse(todoSchema, body);
        if (!result.success) {
            return Response.json(
                { error: "Validation error", issues: result.issues },
                { status: 400 }
            );
        }
        const created = await createTodo(result.output);
        return Response.json(created, { status: 201 });

    } catch (error) {
        if (error instanceof SyntaxError) {
            return Response.json({ error: "Invalid JSON" }, { status: 400 })
        }
        return Response.json({ error: `Internal server error` }, { status: 500 });
    }
}

// safeParse Parses an unknown input based on a schema.
// instanceof check if the data was created with the right type

export const pathTodosController = async (req: Request) => {
    try {
        const body = await req.json();
        const result = v.safeParse(todoSchema, body);
        if (!result.success) {
            return Response.json(
                { error: "Validation error", issues: result.issues },
                { status: 400 }
            )
        }
        const updated = await pathTodo(result.output)
        return Response.json(updated, { status: 200 })
    } catch (error) {
        if (error instanceof SyntaxError) {
            return Response.json({ error: "Invalid JSON" }, { status: 400 })
        }
        return Response.json({ error: `Internal server error` }, { status: 500 })
    }
}