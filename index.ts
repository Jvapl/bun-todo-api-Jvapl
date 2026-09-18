import { postTodosController, getTodosController } from "./db"

const server = Bun.serve({
    port: 3000,
    routes: {
        "/": () => Response.redirect('/todos'),
        "/todos": {
            GET: () => getTodosController(),
            POST: (req) => postTodosController(req)
        }
    }
})

console.log(`Listening on ${server.url}`)