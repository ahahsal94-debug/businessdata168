import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "businessdata", "database.json");
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, "utf-8");
  const db = JSON.parse(content);
  
  console.log("Current user list before deleting:");
  console.log(db.users.map((u: any) => u.username));
  
  // Clear the users, stores, and licenses keys completely
  db.users = [];
  db.stores = {};
  db.licenses = [];
  
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  console.log("Database cleared! All accounts have been deleted successfully.");
} else {
  console.error("Database file not found!");
}
