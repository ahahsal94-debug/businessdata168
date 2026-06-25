import { db } from "../db";

console.log("Users in DB:");
const users = db.getUsers();
for (const u of users) {
  console.log(`User: ${u.username}, ID: ${u.id}`);
  try {
    const profile = db.getSellerProfile(u.id);
    console.log(`- Shop Name: ${profile.shopName}`);
    console.log(`- Logo Emoji: ${profile.logoEmoji}`);
    console.log(`- Logo Image set: ${!!profile.logoImage}`);
    console.log(`- Gemini API Key set: ${!!profile.geminiApiKey}`);
    console.log(`- Gemini API Key value: "${profile.geminiApiKey || ""}"`);
  } catch (err: any) {
    console.error(`Error reading profile for ${u.username}:`, err.message);
  }
}
