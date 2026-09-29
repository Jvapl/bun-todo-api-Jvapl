import { postTodosController, getTodosController, patchTodosController, deleteTodosController, handleOptions, deleteAllTodosController, corsHeader } from "./db"

const server = Bun.serve({
    port: 3000,
    routes: {
        "/": () => Response.redirect('/todos'),
        "/todos/:id": {
            OPTIONS: () => handleOptions(),
            PATCH: (req) => patchTodosController(req),
            DELETE: (req) => deleteTodosController(req)
        },
        "/todos": {
            OPTIONS: () => handleOptions(),
            GET: () => getTodosController(),
            POST: (req) => postTodosController(req),
            DELETE: () => deleteAllTodosController()
        }
    },
    fetch: () => Response.json({ error: "Not found" }, { status: 404, headers: corsHeader }),
    development: true
})

console.log(`Listening on ${server.url}`)

