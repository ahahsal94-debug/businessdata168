import fs from "fs";
import path from "path";

function scanDir(dir: string, results: string[]) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    if (item === "node_modules" || item === ".git" || item === ".gemini") continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, results);
    } else if (stat.isFile()) {
      if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx") || fullPath.endsWith(".json") || fullPath.endsWith(".html") || fullPath.endsWith(".css") || fullPath.endsWith(".js")) {
        results.push(fullPath);
      }
    }
  }
}

const allFiles: string[] = [];
scanDir(process.cwd(), allFiles);

for (const file of allFiles) {
  const content = fs.readFileSync(file, "utf-8");
  if (content.includes("3000")) {
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      if (line.includes("3000")) {
        console.log(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}
