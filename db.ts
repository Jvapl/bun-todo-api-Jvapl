import Database from "bun:sqlite";

const db = new Database('mydb.sqlite')

const schema = await Bun.file("./schema.sql").text()
const test = db.run(schema);

if (test) {
    console.log("todo table exists");
} else {
    console.log("todo table does NOT exist");
}