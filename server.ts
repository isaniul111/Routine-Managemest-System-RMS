import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// In-memory / file system store for user data & backup snapshots
const DATA_DIR = path.join(process.cwd(), "data");
const ENTRIES_FILE = path.join(DATA_DIR, "entries.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadServerEntries() {
  try {
    if (fs.existsSync(ENTRIES_FILE)) {
      return JSON.parse(fs.readFileSync(ENTRIES_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading server entries:", e);
  }
  return [];
}

function saveServerEntries(entries: any[]) {
  try {
    fs.writeFileSync(ENTRIES_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing server entries:", e);
  }
}

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development", timestamp: new Date() });
});

// Authentication endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const user = {
    id: `usr_${Date.now()}`,
    name: email.split("@")[0],
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
    provider: "email",
    createdAt: new Date().toISOString(),
  };
  res.json({ user, token: `token_${Date.now()}` });
});

app.post("/api/auth/google", (req, res) => {
  const user = {
    id: "google_user_99",
    name: "Saniul Islam",
    email: "isaniul999@gmail.com",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    provider: "google",
    createdAt: new Date().toISOString(),
  };
  res.json({ user, token: `google_token_${Date.now()}` });
});

// Entry Sync API
app.get("/api/entries", (req, res) => {
  const entries = loadServerEntries();
  res.json({ entries, count: entries.length });
});

app.post("/api/sync", (req, res) => {
  const { entries } = req.body;
  if (Array.isArray(entries)) {
    saveServerEntries(entries);
    return res.json({ success: true, count: entries.length, syncedAt: new Date().toISOString() });
  }
  res.status(400).json({ error: "Invalid entries array" });
});

// Backup & Restore API
app.get("/api/backup/export", (req, res) => {
  const entries = loadServerEntries();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=ride_routine_backup_${Date.now()}.json`);
  res.send(JSON.stringify({ version: "1.0", app: "RideRoutine", timestamp: new Date().toISOString(), entries }, null, 2));
});

app.post("/api/backup/restore", (req, res) => {
  const { entries } = req.body;
  if (Array.isArray(entries)) {
    saveServerEntries(entries);
    return res.json({ success: true, count: entries.length });
  }
  res.status(400).json({ error: "Invalid backup format" });
});

// --- VITE / STATIC SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
