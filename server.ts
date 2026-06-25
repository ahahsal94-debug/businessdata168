/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { db, verifyToken, signToken, verifyPassword } from "./db";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 168;

// Set body parser limits to support up to two large base64 screenshot uploads (50mb)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Auth token authentication middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  console.log(`[Auth Middleware] Path: ${req.path}, Authorization Header:`, authHeader);
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "សូមចូលប្រើប្រាស់គណនីជាមុនសិន! (Unauthorized: Please login first)" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "គណនីរបស់អ្នកផុតកំណត់ ឬមិនត្រឹមត្រូវ! (Forbidden: Invalid or expired session)" });
  }

  // Fetch latest user details from DB to check license expiration
  const user = db.getUsers().find((u) => u.id === decoded.id);
  if (!user) {
    return res.status(403).json({ error: "រកមិនឃើញគណនីនេះទេ! (Forbidden: User not found)" });
  }

  const isMasterAdmin = user.username.toLowerCase() === "adminkosal2006";
  const isExpired = new Date(user.licenseExpiresAt).getTime() < Date.now();
  if (!isMasterAdmin && isExpired) {
    return res.status(403).json({ 
      error: "expired", 
      message: "គណនីរបស់អ្នកបានផុតកំណត់សិទ្ធិប្រើប្រាស់ហើយ! សូមបញ្ចូលលេខកូដសោរថ្មីដើម្បីបន្ត។ (Your account has expired! Please enter a new license key.)" 
    });
  }

  req.user = user;
  next();
}

// Express API endpoints section
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Authentication endpoints
app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password, role, licenseKey } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងលេខកូដសម្ងាត់! (Username and password are required)" });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "ឈ្មោះអ្នកប្រើប្រាស់ត្រូវមានយ៉ាងតិច ៣ តួអក្សរ! (Username must be at least 3 characters)" });
    }

    const cleanRole = role === "seller" ? "seller" : "admin";
    const isMasterAdmin = cleanUsername.toLowerCase() === "adminkosal2006";
    let expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (isMasterAdmin) {
      expiryDate = new Date("2100-01-01").toISOString(); // Far future for master admin
    } else {
      if (!licenseKey) {
        return res.status(400).json({ error: "សូមបញ្ចូលលេខកូដសិទ្ធិប្រើប្រាស់! (License Key is required to register)" });
      }
      try {
        const durationDays = db.validateAndUseKey(licenseKey, cleanUsername);
        expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      } catch (err: any) {
        return res.status(400).json({ error: err.message });
      }
    }

    const user = db.createUser(cleanUsername, password, cleanRole, expiryDate);
    const token = signToken({ id: user.id, username: user.username, role: user.role, licenseExpiresAt: user.licenseExpiresAt });

    res.status(201).json({ user, token });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ និងលេខកូដសម្ងាត់! (Username and password are required)" });
    }

    const user = db.getUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "ឈ្មោះអ្នកប្រើប្រាស់ ឬលេខកូដសម្ងាត់មិនត្រឹមត្រូវឡើយ! (Invalid username or password)" });
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role, licenseExpiresAt: user.licenseExpiresAt });
    const { passwordHash, ...safeUser } = user;

    res.json({ user: safeUser, token });
  } catch (error: any) {
    res.status(500).json({ error: error.message || String(error) });
  }
});

app.post("/api/auth/renew", (req, res) => {
  try {
    const { username, licenseKey } = req.body;
    if (!username || !licenseKey) {
      return res.status(400).json({ error: "សូមបំពេញព័ត៌មានឱ្យបានគ្រប់គ្រាន់! (Username and License Key are required)" });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: "រកមិនឃើញគណនីនេះទេ! (User not found)" });
    }

    const durationDays = db.validateAndUseKey(licenseKey, user.username);
    const newExpiry = db.extendUserLicense(user.username, durationDays);

    res.json({ success: true, licenseExpiresAt: newExpiry });
  } catch (error: any) {
    res.status(400).json({ error: error.message || String(error) });
  }
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// Admin endpoints
app.post("/api/admin/generate-keys", authenticateToken, (req: any, res) => {
  try {
    if (req.user.username.toLowerCase() !== "adminkosal2006") {
      return res.status(403).json({ error: "សិទ្ធិមិនគ្រប់គ្រាន់! (Only master admin can generate keys)" });
    }
    const { count, durationDays } = req.body;
    const keys = db.generateLicenseKeys(count || 5, durationDays || 30);
    res.json({ success: true, keys });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/keys", authenticateToken, (req: any, res) => {
  try {
    if (req.user.username.toLowerCase() !== "adminkosal2006") {
      return res.status(403).json({ error: "សិទ្ធិមិនគ្រប់គ្រាន់! (Only master admin can view keys)" });
    }
    res.json({ keys: db.getUnusedKeys() });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin User Management endpoints
app.get("/api/admin/users", authenticateToken, (req: any, res) => {
  try {
    if (req.user.username.toLowerCase() !== "adminkosal2006") {
      return res.status(403).json({ error: "សិទ្ធិមិនគ្រប់គ្រាន់! (Only master admin can view users)" });
    }
    const users = db.getUsers().map(({ passwordHash, ...safe }) => safe);
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/users/:userId", authenticateToken, (req: any, res) => {
  try {
    if (req.user.username.toLowerCase() !== "adminkosal2006") {
      return res.status(403).json({ error: "សិទ្ធិមិនគ្រប់គ្រាន់! (Only master admin can delete users)" });
    }
    const { userId } = req.params;
    if (userId === req.user.id) {
      return res.status(400).json({ error: "មិនអាចលុបគណនីខ្លួនឯងបានទេ! (Cannot delete your own account)" });
    }
    db.deleteUser(userId);
    res.json({ success: true, message: "គណនីត្រូវបានលុបដោយជោគជ័យ! (Account deleted successfully)" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/users/extend", authenticateToken, (req: any, res) => {
  try {
    if (req.user.username.toLowerCase() !== "adminkosal2006") {
      return res.status(403).json({ error: "សិទ្ធិមិនគ្រប់គ្រាន់! (Only master admin can extend licenses)" });
    }
    const { username, durationDays } = req.body;
    if (!username || !durationDays) {
      return res.status(400).json({ error: "ទិន្នន័យមិនគ្រប់គ្រាន់! (Username and durationDays required)" });
    }
    const newExpiry = db.extendUserLicense(username, durationDays);
    res.json({ success: true, licenseExpiresAt: newExpiry });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});



// Database-backed Products routes
app.get("/api/products", authenticateToken, (req: any, res) => {
  res.json(db.getProducts(req.user.id));
});

app.post("/api/products", authenticateToken, (req: any, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "ទិន្នន័យមិនត្រឹមត្រូវ (Invalid products payload)" });
    }
    db.saveProducts(req.user.id, products);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Database-backed Orders routes
app.get("/api/orders", authenticateToken, (req: any, res) => {
  res.json(db.getOrders(req.user.id));
});

app.post("/api/orders", authenticateToken, (req: any, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: "ទិន្នន័យមិនត្រឹមត្រូវ (Invalid orders payload)" });
    }
    db.saveOrders(req.user.id, orders);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Database-backed Settings routes
app.get("/api/settings/profile", authenticateToken, (req: any, res) => {
  res.json(db.getSellerProfile(req.user.id));
});

app.post("/api/settings/profile", authenticateToken, (req: any, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "ទិន្នន័យមិនត្រឹមត្រូវ (Invalid profile payload)" });
    }
    db.saveSellerProfile(req.user.id, profile);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/settings/telegram", authenticateToken, (req: any, res) => {
  res.json({ telegramGroupLink: db.getTelegramGroupLink(req.user.id) });
});

app.post("/api/settings/telegram", authenticateToken, (req: any, res) => {
  try {
    const { telegramGroupLink } = req.body;
    if (telegramGroupLink === undefined) {
      return res.status(400).json({ error: "ទិន្នន័យមិនត្រឹមត្រូវ (Invalid telegramGroupLink payload)" });
    }
    db.saveTelegramGroupLink(req.user.id, telegramGroupLink);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Proxy Endpoint: Send order details to Telegram Channel, Group, or Chat via Telegram Bot API server-side (bypassing browser CORS)
 */
app.post("/api/telegram-sync", authenticateToken, async (req, res) => {
  try {
    const { botToken, chatId, message, parseMode } = req.body;
    if (!botToken || !chatId) {
      return res.status(400).json({ error: "សូមបញ្ចូល Bot Token និង Chat ID ជាមុនសិន! (Bot Token and Chat ID are required)" });
    }

    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: parseMode || "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data: any = await response.json();
    if (!response.ok || !data.ok) {
      return res.status(400).json({ 
        error: data.description || `Telegram API response error: ${response.status}` 
      });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Telegram proxy sync failure:", error);
    res.status(500).json({
      error: "ការបញ្ជូនទៅ Telegram បរាជ័យ (Telegram Sync failed): " + (error.message || String(error)),
    });
  }
});

/**
 * Helper to split a standard Base64 Data URL into mimeType and raw base64 data
 */
function parseBase64DataUrl(url: string) {
  const matches = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches) {
    return { mimeType: "image/jpeg", data: url };
  }
  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

/**
 * Post Endpoint: Extract Customer Information from images using Gemini OCR Multimodal Model
 */
app.post("/api/extract-info", authenticateToken, async (req: any, res) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "គ្មានរូបភាពត្រូវបានបញ្ចូលទេ (No images provided)" });
    }

    const userProfile = db.getSellerProfile(req.user.id);
    const apiKey = (userProfile && userProfile.geminiApiKey) || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY (both User Profile and Environment Variable are empty)");
      return res.status(400).json({
        error: "សូមបំពេញ GEMINI_API_KEY នៅក្នុងប្រវត្តិរូបរបស់អ្នកជាមុនសិន! (Please fill Gemini API Key in your profile settings first!)",
      });
    }

    // Initialize modern @google/genai Client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      apiVersion: "v1beta",
      httpOptions: {
        apiVersion: "v1beta",
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Map each base64 string directly into a part for the contents payload
    const imageParts = images.slice(0, 2).map((imgUrl) => {
      const parsed = parseBase64DataUrl(imgUrl);
      return {
        inlineData: {
          mimeType: parsed.mimeType,
          data: parsed.data,
        },
      };
    });

    const textPart = {
      text: `Analyze the provided shipping label, name card, chat screenshot, or receipt image(s) to automatically extract customer information (Name, Phone number, Location / Address) strictly as written.

Specific Extraction Guidelines:
1. **Customer Name**:
   - In chat screenshots (like Facebook Messenger, Telegram, WhatsApp, Viber, Line), the customer's name is usually the contact name displayed in the header at the very top of the image (next to the back button '<' or profile image).
   - Also look for labels like "ឈ្មោះ", "ឈ្មោះអ្នកទទួល", "To:", "Name:", "Customer:", etc.
   - **CRITICAL WARNING**: Do NOT extract product names, brand names, or promotional titles (such as "ស្រីឆ្នើម", "Fiber 3Plus", "តម្លៃប្រូម៉ូសិនពិសេស") printed on advertisement banners/flyers inside the chat. The customer's name must be the actual person's name (normally in the chat header, e.g., "ភ្នំ ជ័យគិរី").
   
2. **Phone Number**:
   - Look for numbers like "060622784", "012345678" or "012-345-678" in text bubbles, labels like "លេខទូរស័ព្ទ", "ទូរស័ព្ទ", "Tel:", "Phone:", "Contact:", etc.
   
3. **Location / Address**:
   - Extract any address/location details. This includes Cambodian addresses containing terms like village ("ភូមិ..."), commune/quarter ("ឃុំ..." or "សង្កាត់..."), district ("ស្រុក..." or "ខណ្ឌ..."), province/city ("ខេត្ត..." or "ក្រុង..." or "ភ្នំពេញ" / "Phnom Penh").
   - Extract the location even if it's not explicitly labeled with "អាសយដ្ឋាន" or "ទីតាំង".
   - **CRITICAL FORMAT RULE**: The extracted address MUST be formatted from the smallest administrative unit to the largest, with the Province (ខេត្ត) or City (រាជធានី / ភ្នំពេញ) always placed at the very end of the address string. Even if the text in the image starts with the province/district first, you must rearrange it. Example: "ភូមិហាន់ជ័យ ស្រុកកំពង់សៀម ខេត្តកំពង់ចាម" (NOT "ស្រុកកំពង់សៀម ខេត្តកំពង់ចាម ភូមិហាន់ជ័យ").

Rules:
1. Do not invent or hallucinate info. If a field is not present in the image(s), leave it as an empty string ("").
2. Retain original Khmer spelling and text format for names and locations.`,
    };

    let response;
    try {
      console.log("Attempting OCR extraction with primary model: gemini-2.5-flash");
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [...imageParts, textPart],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              customerName: {
                type: Type.STRING,
                description: "Extracted customer name. Empty string if not found.",
              },
              customerPhone: {
                type: Type.STRING,
                description: "Extracted customer phone. Format cleanly e.g. '012345678' or '012-345-678'. Empty string if not found.",
              },
              customerLocation: {
                type: Type.STRING,
                description: "Extracted full address/location of the customer. Empty string if not found.",
              },
            },
            required: ["customerName", "customerPhone", "customerLocation"],
          },
        },
      });
    } catch (err: any) {
      console.warn("Primary gemini-2.5-flash failed or overloaded. Trying fallback model gemini-2.0-flash...", err.message || err);
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: {
            parts: [...imageParts, textPart],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                customerName: {
                  type: Type.STRING,
                  description: "Extracted customer name. Empty string if not found.",
                },
                customerPhone: {
                  type: Type.STRING,
                  description: "Extracted customer phone. Format cleanly e.g. '012345678' or '012-345-678'. Empty string if not found.",
                },
                customerLocation: {
                  type: Type.STRING,
                  description: "Extracted full address/location of the customer. Empty string if not found.",
                },
              },
              required: ["customerName", "customerPhone", "customerLocation"],
            },
          },
        });
      } catch (err2: any) {
        console.warn("Fallback gemini-2.0-flash failed or overloaded. Trying older fallback model gemini-1.5-flash...", err2.message || err2);
        response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: {
            parts: [...imageParts, textPart],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                customerName: {
                  type: Type.STRING,
                  description: "Extracted customer name. Empty string if not found.",
                },
                customerPhone: {
                  type: Type.STRING,
                  description: "Extracted customer phone. Format cleanly e.g. '012345678' or '012-345-678'. Empty string if not found.",
                },
                customerLocation: {
                  type: Type.STRING,
                  description: "Extracted full address/location of the customer. Empty string if not found.",
                },
              },
              required: ["customerName", "customerPhone", "customerLocation"],
            },
          },
        });
      }
    }

    const parsedText = response.text || "{}";
    const result = JSON.parse(parsedText);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini OCR Processing error:", error);
    res.status(500).json({
      error: "ការស្កេនចាប់យកទិន្នន័យបានបរាជ័យ (Extraction failed): " + (error.message || error),
    });
  }
});

// Setup Vite Dev server middleware or Production Static file serving
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully booted and listening on http://localhost:${PORT} (or http://businessdata:${PORT})`);
  });
}

initializeServer();
