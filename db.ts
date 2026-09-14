import Database from "bun:sqlite";

// === Creation ===

const db = new Database('mydb.sqlite')

const schema = await Bun.file("./schema.sql").text()
db.run(schema);

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

export function getTodos() {
    db.run(`INSERT INTO todos (title, content, due_date, done)
        VALUES ('JAJAJA','Description','2000-12-22',1)
        `)
    const data = db.query("SELECT * FROM todos").all();
    return Response.json(data);
}