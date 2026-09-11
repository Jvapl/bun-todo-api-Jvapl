import Database from "bun:sqlite";

const db = new Database('mydb.sqlite')

const schema = await Bun.file("./schema.sql").text()
db.run(schema);

const table = db
    .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'todo'")
    .get();

if (table) {
    console.log("todo table exists");
} else {
    console.log("todo table does NOT exist");
}

// query = prepare SQL request (doesn't execute)
// get = take first line from this preparation and execute