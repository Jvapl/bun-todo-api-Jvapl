import { getTodos } from "./db"

const server = Bun.serve({
    port: 3000,
    routes: {
        "/": () => Response.redirect('/todos'),
        "/todos": () => getTodos()
    }
})

console.log(`Listening on ${server.url}`)