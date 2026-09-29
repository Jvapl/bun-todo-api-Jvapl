import * as v from "valibot"

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

export const toCreateTodoSchema = v.omit(todoSchema, ['id'])

export type toCreateTodo = v.InferOutput<typeof toCreateTodoSchema>

export const deleteTodoSchema = v.object({
    id: v.pipe(
        v.string(),
        v.transform(Number),
        v.integer()
    )
})

export const patchTodoSchema = v.partial(toCreateTodoSchema)

// v.object create an object that let me rule sending data
// v.InferOutput<typeof todoSchema> create a "real type" usable for typeScript.
// v.transform changes type from string to date here.
// my v.toMinValue is to check if the current date is on the past.  
// Omit it's when we remove one line of type.