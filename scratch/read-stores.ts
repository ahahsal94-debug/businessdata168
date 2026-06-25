import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "database.json");
const content = fs.readFileSync(dbPath, "utf-8");
const db = JSON.parse(content);

console.log("STORES KEYS:", Object.keys(db.stores));
for (const [key, value] of Object.entries(db.stores)) {
  const store = value as any;
  console.log(`Store key: ${key}`);
  console.log(`- Shop Name: ${store.sellerProfile?.shopName}`);
  console.log(`- Subtitle: ${store.sellerProfile?.subtitle}`);
  console.log(`- Address: ${store.sellerProfile?.addressAndContact}`);
  console.log(`- Signature: ${store.sellerProfile?.signatureLabel}`);
  console.log(`- Telegram Link: ${store.telegramGroupLink}`);
}
