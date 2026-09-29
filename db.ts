import { Database } from "bun:sqlite";
import * as v from "valibot"

export const corsHeader = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, prefer"
}

export const handleOptions = () => new Response(null, {
    status: 204,
    headers: corsHeader
});

// === Valibot ===

const isoDateOrTimestamp = v.union(
    [
        v.pipe(v.string(), v.isoDate()),
        v.pipe(v.string(), v.isoTimestamp())
    ],
    "Invalid date format."
)
// v.union verify this two formats at the same time 

export const todoSchema = v.object({
    id: v.number(),
    title: v.pipe(v.string(), v.trim(), v.nonEmpty("Can't be empty")),
    content: v.nullish((v.string()), null),
    due_date: v.nullish(isoDateOrTimestamp, null),
    done: v.pipe(v.boolean(), v.transform((boll) => boll ? 1 : 0)),
})

export type Todo = v.InferOutput<typeof todoSchema>;

const toCreateTodoSchema = v.omit(todoSchema, ['id'])

export type toCreateTodo = v.InferOutput<typeof toCreateTodoSchema>

const deleteTodoSchema = v.object({
    id: v.pipe(
        v.string(),
        v.transform(Number),
        v.integer()
    )
})

const patchTodoSchema = v.partial(toCreateTodoSchema)

// v.object create an object that let me rule sending data
// v.InferOutput<typeof todoSchema> create a "real type" usable for typeScript.
// v.transform changes type from string to date here.
// my v.toMinValue is to check if the current date is on the past.  
// Omit it's when we remove one line of type.

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

const createTodo = async (todo: toCreateTodo) => {
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

const patchTodo = (id: number, patch: Partial<toCreateTodo>) => {
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

const deleteTodo = async (id: number): Promise<{ changes: number, lastInsertRowid: number | bigint }> => {
    const result: { changes: number, lastInsertRowid: number | bigint } = db.query(`delete from todos where id = $id`).run({ $id: id })
    return result
}

const deleteAllTodos = async () => {
    db.query("delete from todos").run()
}

// === Controllers ===

export const getTodosController = async () => {
    try {
        const todos = await getTodos();
        return Response.json(todos, { headers: corsHeader });
    } catch {
        return Response.json({ error: `Internal server error` }, { status: 500, headers: corsHeader })
    }
}

export const postTodosController = async (req: Request) => {
    try {
        const body = await req.json();
        const result = v.safeParse(toCreateTodoSchema, body);
        if (!result.success) {
            return Response.json(
                { error: "Validation error", issues: result.issues },
                { status: 400, headers: corsHeader }
            );
        }
        const created = await createTodo(result.output);
        return Response.json(created, { status: 201, headers: corsHeader });

    } catch (error) {
        if (error instanceof SyntaxError) {
            return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeader })
        }
        return Response.json({ error: `Internal server error` }, { status: 500, headers: corsHeader });
    }
}

// safeParse Parses an unknown input based on a schema.
// instanceof check if the data was created with the right type

export const patchTodosController = async (req: RequestParams) => {
    try {
        const idParamSchema = v.object({
            id: v.pipe(
                v.string(),
                v.digits("Invalid ID"),
                v.transform(Number),
                v.minValue(1)
            )
        })
        //  v.digits accepts only 0-9 numbers 
        //  Params holds the variable parts of the URL
        const idResult = v.safeParse(idParamSchema, { id: req.params.id })

        if (!idResult.success) {
            return Response.json(
                { error: "Validation error", issues: idResult.issues },
                { status: 400, headers: corsHeader }
            )
        }

        const body = await req.json()
        const result = v.safeParse(patchTodoSchema, body)
        if (!result.success) {
            return Response.json(
                { error: "Validation error", issues: result.issues },
                { status: 400, headers: corsHeader }
            )
        }
        const updated = patchTodo(idResult.output.id, result.output)

        if (!updated) {
            return Response.json({ error: "Todo not found" }, { status: 404, headers: corsHeader })
        }
        return Response.json(updated, { status: 200, headers: corsHeader })
    } catch (error) {
        if (error instanceof SyntaxError) {
            return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeader })
        }
        return Response.json({ error: `Internal server error` }, { status: 500, headers: corsHeader })
    }
}

interface RequestParams extends Request {
    params: {
        id: string
    }
}

export const deleteTodosController = async (req: RequestParams) => {
    try {
        const result = v.safeParse(deleteTodoSchema, { id: req.params.id })

        if (!result.success) {
            return Response.json(
                { error: "Validation error", issues: result.issues },
                { status: 400, headers: corsHeader }
            )
        }

        const dbResult = await deleteTodo(result.output.id)

        if (dbResult.changes === 0) {
            return Response.json({ error: "Todo introuvable" }, { status: 404, headers: corsHeader })
        }
        return new Response(null, { status: 204, headers: corsHeader })
    } catch (error) {
        if (error instanceof SyntaxError) {
            return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeader })
        }
        return Response.json({ error: "Internal server error " }, { status: 500, headers: corsHeader })
    }
}

export const deleteAllTodosController = async () => {
    try {
        await deleteAllTodos()
        return new Response(null, { status: 204, headers: corsHeader })
    } catch {
        return Response.json({ error: "Internal server error" }, { status: 500, headers: corsHeader })
    }
}