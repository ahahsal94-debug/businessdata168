import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "database.json");
const content = fs.readFileSync(DB_PATH, "utf-8");
const db = JSON.parse(content);

console.log("USERS:");
console.log(JSON.stringify(db.users, null, 2));
