import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "database.json");
if (fs.existsSync(dbPath)) {
  const content = fs.readFileSync(dbPath, "utf-8");
  const parsed = JSON.parse(content);
  console.log("DB keys:", Object.keys(parsed));
  
  // Search the string content for "168" or "business" or "data"
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (line.includes("168") || line.includes("businessdata")) {
      console.log(`Line ${index + 1}: ${line.trim().substring(0, 100)}`);
    }
  });
} else {
  console.log("DB does not exist");
}
