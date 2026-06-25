import fs from "fs";
import path from "path";

const files = [
  "db.ts",
  "server.ts",
  "src/App.tsx",
  "src/components/Login.tsx",
  "src/components/SellerProfileModal.tsx"
];

for (const file of files) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes("business") || line.toLowerCase().includes("data") || line.toLowerCase().includes("168")) {
      console.log(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
}
