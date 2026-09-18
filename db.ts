import Database from "bun:sqlite";
import * as v from "valibot"

// === Valibot ===

export const todoSchema = v.object({

    title: v.pipe(v.string(), v.trim(), v.nonEmpty("Can't be empty")),
    content: v.nullish(v.string(), null),
    due_date: v.pipe(v.string()),
    done: v.boolean()
})

export type Todo = v.InferOutput<typeof todoSchema>;

// v.object create an object that let me rule sending data
// v.InferOutput<typeof todoSchema> create a "real type" usable for typeScript

// verifier si title et content a une espace
// verifier si c'est vraiment une date et si c'est espace

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

async function getTodos() {
    return await db.query("SELECT * FROM todos").all();
}

export function createTodo(todo: Todo) {
    const { lastInsertRowid } = db.query(
        `INSERT INTO todos (title, content, due_date, done)
        VALUES ($title, $content, $due_date, $done)`
    ).run({
        $title: todo.title,
        $content: todo.content,
        $due_date: todo.due_date,
        $done: todo.done,
    });

    return db.query("SELECT * FROM todos WHERE id = ?").get(lastInsertRowid);
}

// body : unknown its the function doesn't know what he's going to get that's why unknown
// safeParse : take what I did with object
// db.query(`SELECT * FROM todos WHERE id = ?`).get(lastInsertRowid) :


// === Controllers ===

export async function getTodosController() {
    const todos = await getTodos();
    return Response.json(todos);
}

export async function postTodosController(req: Request) {
    try {
        const body = await req.json();
        const result = v.safeParse(todoSchema, body);
        if (!result.success) {
            return Response.json(
                { error: "Validation error", issues: result.issues },
                { status: 400 }
            );
        }
        const created = createTodo(result.output);
        return Response.json(created, { status: 201 });

    } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
}