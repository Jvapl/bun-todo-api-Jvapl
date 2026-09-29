import { Database } from "bun:sqlite";

export const corsHeader = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, prefer"
}

export const handleOptions = () => new Response(null, {
    status: 204,
    headers: corsHeader
});


// === DB ===

export const db = new Database('mydb.sqlite')

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