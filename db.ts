import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const DB_DIR = path.join(process.cwd(), "businessdata");
const DB_PATH = path.join(DB_DIR, "database.json");
const ENV_PATH = path.join(process.cwd(), ".env");

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Sync database from cloud on startup
function syncFromCloudOnStartup() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.log("No cloud database credentials configured (UPSTASH_REDIS_REST_URL/TOKEN). Running in local-only mode.");
    return;
  }

  try {
    console.log("Syncing database from Upstash Cloud...");
    const cmd = `curl -s -H "Authorization: Bearer ${token}" "${url}/get/database"`;
    const responseText = execSync(cmd).toString();
    const responseObj = JSON.parse(responseText);
    
    if (responseObj && responseObj.result) {
      const dbContent = responseObj.result;
      fs.writeFileSync(DB_PATH, dbContent, "utf-8");
      console.log("Database sync from cloud completed successfully!");
    } else {
      console.log("Cloud database is empty or not found. Starting with default/local database.");
    }
  } catch (error) {
    console.error("Failed to sync database from cloud on startup:", error);
  }
}

function uploadToCloud(dataStr: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;

  fetch(`${url}/set/database`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    },
    body: dataStr
  })
  .then(res => res.json())
  .then(resObj => {
    if (resObj.result === "OK") {
      // console.log("Database successfully synced to cloud.");
    } else {
      console.error("Cloud sync save response not OK:", resObj);
    }
  })
  .catch(err => {
    console.error("Failed to save database to cloud:", err);
  });
}

// Perform sync on startup
syncFromCloudOnStartup();

// Interfaces
export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "seller";
  createdAt: string;
  licenseExpiresAt: string; // ISO date string e.g. "2026-07-25T17:00:00.000Z"
}

export interface StoreRecord {
  products: any[];
  orders: any[];
  sellerProfile: {
    shopName: string;
    subtitle: string;
    addressAndContact: string;
    signatureLabel: string;
    logoEmoji: string;
    logoImage?: string;
    geminiApiKey?: string;
  };
  telegramGroupLink: string;
}

export interface LicenseKeyRecord {
  key: string;
  durationDays: number;
  isUsed: boolean;
  usedBy?: string; // username
  createdAt: string;
}

export interface DbSchema {
  users: UserRecord[];
  stores: Record<string, StoreRecord>;
  licenses: LicenseKeyRecord[];
}

const defaultDb: DbSchema = {
  users: [],
  stores: {},
  licenses: []
};

// Default store template
export function createDefaultStore(username: string): StoreRecord {
  return {
    products: [],
    orders: [],
    sellerProfile: {
      shopName: `ហាងអនឡាញរបស់ ${username} (Shop)`,
      subtitle: "ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់",
      addressAndContact: "ភ្នំពេញ, កម្ពុជា",
      signatureLabel: username,
      logoEmoji: "🇰🇭"
    },
    telegramGroupLink: ""
  };
}

// Legacy schema migration
function migrateDb(data: any): DbSchema {
  const migrated: DbSchema = {
    users: data.users || [],
    stores: data.stores || {},
    licenses: data.licenses || []
  };

  // 1. Migrate flat data
  if (data.products && Array.isArray(data.products) && data.products.length > 0) {
    const firstUser = migrated.users[0];
    const targetUserId = firstUser ? firstUser.id : "legacy-user";

    migrated.stores[targetUserId] = {
      products: data.products,
      orders: data.orders || [],
      sellerProfile: data.sellerProfile || {
        shopName: "ហាងអនឡាញម៉ូដថ្មី (NEW STYLE SHOP)",
        subtitle: "ទិញលឿន រហ័ស និងមានទំនុកចិត្តខ្ពស់",
        addressAndContact: "ភ្នំពេញ, កម្ពុជា | (+855) 12 345 678",
        signatureLabel: "ហាង ម៉ូដថ្មី",
        logoEmoji: "🇰🇭"
      },
      telegramGroupLink: data.telegramGroupLink || ""
    };
  }

  // 2. Add licenseExpiresAt to users who don't have it
  migrated.users = migrated.users.map((u: any) => {
    if (!u.licenseExpiresAt) {
      // If it is the master admin, set it to the far future, otherwise 30 days from now
      const isMasterAdmin = u.username.toLowerCase() === "adminkosal2006";
      const expiry = isMasterAdmin 
        ? new Date("2100-01-01") 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return {
        ...u,
        licenseExpiresAt: expiry.toISOString()
      };
    }
    return u;
  });

  return migrated;
}

// Thread-safe Read & Write
function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(defaultDb);
      return defaultDb;
    }
    const content = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(content);

    // Run migration if structure is legacy or incomplete
    const needsMigration = parsed.products || parsed.orders || (parsed.users && parsed.users.some((u: any) => !u.licenseExpiresAt)) || !parsed.licenses;
    if (needsMigration) {
      const migrated = migrateDb(parsed);
      writeDb(migrated);
      return migrated;
    }

    return parsed as DbSchema;
  } catch (error) {
    console.error("Error reading database:", error);
    return defaultDb;
  }
}

function writeDb(data: DbSchema): void {
  try {
    const dataStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_PATH, dataStr, "utf-8");
    uploadToCloud(dataStr);
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Ensure JWT secret is set
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (fs.existsSync(ENV_PATH)) {
    const envContent = fs.readFileSync(ENV_PATH, "utf-8");
    const match = envContent.match(/^JWT_SECRET=(.+)$/m);
    if (match) {
      JWT_SECRET = match[1].trim();
    }
  }

  if (!JWT_SECRET) {
    JWT_SECRET = crypto.randomBytes(32).toString("hex");
    fs.appendFileSync(ENV_PATH, `\nJWT_SECRET=${JWT_SECRET}\n`, "utf-8");
    console.log("Generated and appended new JWT_SECRET to .env file.");
  }
}

// Password Hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === verifyHash;
  } catch {
    return false;
  }
}

// JWT Token Signing
export function signToken(payload: { id: string; username: string; role: string; licenseExpiresAt: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) })).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET!).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { id: string; username: string; role: "admin" | "seller"; licenseExpiresAt: string } | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET!).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;

    return JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

// Get or create store helper
function getOrCreateStore(userId: string): StoreRecord {
  const data = readDb();
  if (!data.stores) {
    data.stores = {};
  }
  if (!data.stores[userId]) {
    const user = data.users.find((u) => u.id === userId);
    const name = user ? user.username : "ហាងថ្មី";
    data.stores[userId] = createDefaultStore(name);
    writeDb(data);
  }
  return data.stores[userId];
}

// Generate a random key e.g. KEY-A1B2-C3D4-E5F6
function generateRandomKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = (len: number) => {
    let str = "";
    for (let i = 0; i < len; i++) {
      str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
  };
  return `KEY-${part(4)}-${part(4)}-${part(4)}`;
}

// Database Methods
export const db = {
  // Users
  getUsers: () => {
    return readDb().users;
  },
  getUserByUsername: (username: string) => {
    return readDb().users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  },
  createUser: (username: string, passwordPlain: string, role: "admin" | "seller", licenseExpiresAt: string) => {
    const data = readDb();
    const existing = data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error("ឈ្មោះអ្នកប្រើប្រាស់នេះមានរួចហើយ! (Username already exists!)");
    }

    const newUser: UserRecord = {
      id: `usr-${Date.now()}`,
      username,
      passwordHash: hashPassword(passwordPlain),
      role,
      createdAt: new Date().toISOString(),
      licenseExpiresAt
    };

    if (!data.stores) {
      data.stores = {};
    }

    data.users.push(newUser);
    data.stores[newUser.id] = createDefaultStore(username);
    writeDb(data);

    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  },

  // Products
  getProducts: (userId: string) => {
    return getOrCreateStore(userId).products;
  },
  saveProducts: (userId: string, products: any[]) => {
    const data = readDb();
    if (!data.stores) {
      data.stores = {};
    }
    if (!data.stores[userId]) {
      data.stores[userId] = createDefaultStore(userId);
    }
    data.stores[userId].products = products;
    writeDb(data);
  },

  // Orders
  getOrders: (userId: string) => {
    return getOrCreateStore(userId).orders;
  },
  saveOrders: (userId: string, orders: any[]) => {
    const data = readDb();
    if (!data.stores) {
      data.stores = {};
    }
    if (!data.stores[userId]) {
      data.stores[userId] = createDefaultStore(userId);
    }
    data.stores[userId].orders = orders;
    writeDb(data);
  },

  // Seller Profile
  getSellerProfile: (userId: string) => {
    return getOrCreateStore(userId).sellerProfile;
  },
  saveSellerProfile: (userId: string, profile: any) => {
    const data = readDb();
    if (!data.stores) {
      data.stores = {};
    }
    if (!data.stores[userId]) {
      data.stores[userId] = createDefaultStore(userId);
    }
    data.stores[userId].sellerProfile = profile;
    writeDb(data);
  },

  // Telegram Link
  getTelegramGroupLink: (userId: string) => {
    return getOrCreateStore(userId).telegramGroupLink;
  },
  saveTelegramGroupLink: (userId: string, link: string) => {
    const data = readDb();
    if (!data.stores) {
      data.stores = {};
    }
    if (!data.stores[userId]) {
      data.stores[userId] = createDefaultStore(userId);
    }
    data.stores[userId].telegramGroupLink = link;
    writeDb(data);
  },

  // License Keys Methods
  getUnusedKeys: () => {
    const data = readDb();
    return (data.licenses || []).filter((l) => !l.isUsed);
  },
  
  generateLicenseKeys: (count: number, durationDays: number) => {
    const data = readDb();
    if (!data.licenses) {
      data.licenses = [];
    }

    const generated: LicenseKeyRecord[] = [];
    for (let i = 0; i < count; i++) {
      const newKey: LicenseKeyRecord = {
        key: generateRandomKey(),
        durationDays,
        isUsed: false,
        createdAt: new Date().toISOString()
      };
      data.licenses.push(newKey);
      generated.push(newKey);
    }
    writeDb(data);
    return generated;
  },

  validateAndUseKey: (key: string, username: string) => {
    const data = readDb();
    const lic = (data.licenses || []).find((l) => l.key.toUpperCase() === key.toUpperCase().trim());
    
    if (!lic) {
      throw new Error("លេខកូដសិទ្ធិប្រើប្រាស់នេះមិនត្រឹមត្រូវឡើយ! (Invalid license key!)");
    }
    if (lic.isUsed) {
      throw new Error("លេខកូដសិទ្ធិប្រើប្រាស់នេះត្រូវបានគេប្រើប្រាស់រួចហើយ! (License key has already been used!)");
    }

    lic.isUsed = true;
    lic.usedBy = username;
    writeDb(data);
    return lic.durationDays;
  },

  deleteUser: (userId: string) => {
    const data = readDb();
    data.users = data.users.filter((u) => u.id !== userId);
    if (data.stores && data.stores[userId]) {
      delete data.stores[userId];
    }
    writeDb(data);
  },

  extendUserLicense: (username: string, durationDays: number) => {
    const data = readDb();
    const user = data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
      throw new Error("រកមិនឃើញគណនីនេះទេ! (User not found!)");
    }

    const now = Date.now();
    let baseTime = now;
    
    // If user is not expired yet, extend from current expiry date, otherwise extend from now
    const currentExpiry = new Date(user.licenseExpiresAt).getTime();
    if (currentExpiry > now) {
      baseTime = currentExpiry;
    }

    const newExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000);
    user.licenseExpiresAt = newExpiry.toISOString();
    writeDb(data);
    return user.licenseExpiresAt;
  }
};
