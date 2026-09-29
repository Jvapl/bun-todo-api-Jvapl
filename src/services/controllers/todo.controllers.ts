import { getTodos, createTodo, patchTodo, deleteTodo, deleteAllTodos } from "../todo.services";
import * as v from "valibot"
import { corsHeader } from "../../db";
import { toCreateTodoSchema, patchTodoSchema, deleteTodoSchema } from "../../schemas/todo.schema";

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