import fs from "fs";
import path from "path";

const legacyDbDir = path.join(process.cwd(), "data");
const legacyDbPath = path.join(legacyDbDir, "database.json");

const targetDbDir = path.join(process.cwd(), "businessdata");
const targetDbPath = path.join(targetDbDir, "database.json");

console.log("Starting database migration...");

// 1. Ensure target directory exists
if (!fs.existsSync(targetDbDir)) {
  fs.mkdirSync(targetDbDir, { recursive: true });
  console.log(`Created directory: ${targetDbDir}`);
}

// 2. Determine source database path
let dbPathToRead = legacyDbPath;
if (!fs.existsSync(legacyDbPath)) {
  if (fs.existsSync(targetDbPath)) {
    dbPathToRead = targetDbPath;
    console.log("No legacy database.json found in 'data/', but already exists in 'businessdata/'. Using that.");
  } else {
    console.log("No database.json file found anywhere. Nothing to migrate.");
    process.exit(0);
  }
}

// 3. Read and migrate database
try {
  const content = fs.readFileSync(dbPathToRead, "utf-8");
  const db = JSON.parse(content);
  
  let migratedCount = 0;
  
  if (db.users && Array.isArray(db.users)) {
    db.users = db.users.map((user: any) => {
      if (user.username.toLowerCase() === "admin") {
        console.log(`Migrating user: "${user.username}" -> "Adminkosal2006"`);
        user.username = "Adminkosal2006";
        user.licenseExpiresAt = new Date("2100-01-01").toISOString(); // Superadmin expiry
        migratedCount++;
      }
      return user;
    });
  }

  // Save the migrated DB to the new location
  fs.writeFileSync(targetDbPath, JSON.stringify(db, null, 2), "utf-8");
  console.log(`Saved migrated database to ${targetDbPath}`);

  // 4. Move other files in data directory if any, then clean up
  if (fs.existsSync(legacyDbPath)) {
    fs.unlinkSync(legacyDbPath);
    console.log(`Deleted legacy file: ${legacyDbPath}`);
  }
  if (fs.existsSync(legacyDbDir)) {
    const remainingFiles = fs.readdirSync(legacyDbDir);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(legacyDbDir);
      console.log(`Removed empty legacy directory: ${legacyDbDir}`);
    } else {
      console.log(`Legacy directory ${legacyDbDir} is not empty. Moving remaining files:`, remainingFiles);
      for (const file of remainingFiles) {
        fs.renameSync(path.join(legacyDbDir, file), path.join(targetDbDir, file));
      }
      fs.rmdirSync(legacyDbDir);
      console.log(`Successfully moved all remaining files and removed ${legacyDbDir}`);
    }
  }

  console.log(`Migration finished successfully! Migrated ${migratedCount} accounts.`);
} catch (err: any) {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
}
