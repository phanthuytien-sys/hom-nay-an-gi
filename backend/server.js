// =====================================================================
//  Hôm Nay Ăn Gì? — Backend API (Node.js + Express)
//  Chức năng:
//    1) API danh sách quán ăn (xem / thêm / gợi ý)
//    2) Lưu lịch sử & sở thích người dùng
//    3) Tích hợp Google Places (quán ăn thật quanh vị trí) + fallback
// =====================================================================
import express from "express";
import cors from "cors";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const RESTAURANTS_FILE = join(DATA_DIR, "restaurants.json");
const HISTORY_FILE = join(DATA_DIR, "history.json");

const PORT = process.env.PORT || 3000;
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

const app = express();
app.use(cors());
app.use(express.json());

// ---------- helpers lưu trữ (JSON file) ----------
async function readJSON(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(await readFile(file, "utf-8"));
  } catch {
    return fallback;
  }
}
async function writeJSON(file, data) {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

// =====================================================================
//  0) Health check
// =====================================================================
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hom-nay-an-gi", googlePlaces: !!GOOGLE_KEY });
});

// =====================================================================
//  1) API DANH SÁCH QUÁN ĂN
// =====================================================================

// GET /api/restaurants  — lọc theo type, maxPrice, maxDist, who
app.get("/api/restaurants", async (req, res) => {
  const { type, maxPrice, maxDist, who } = req.query;
  let list = await readJSON(RESTAURANTS_FILE, []);
  if (type && type !== "any") list = list.filter((d) => d.type === type);
  if (maxPrice) list = list.filter((d) => d.price <= Number(maxPrice));
  if (maxDist) list = list.filter((d) => d.dist <= Number(maxDist));
  if (who) list = list.filter((d) => Array.isArray(d.who) && d.who.includes(who));
  res.json({ count: list.length, data: list });
});

// GET /api/restaurants/pick — "AI vợ" chọn món hợp nhất
app.get("/api/restaurants/pick", async (req, res) => {
  const { type, budget, who, distance } = req.query;
  const all = await readJSON(RESTAURANTS_FILE, []);
  let list = all.filter(
    (d) =>
      (!budget || d.price <= Number(budget) + 1) &&
      (!distance || d.dist <= Number(distance)) &&
      (!type || type === "any" || d.type === type) &&
      (!who || (Array.isArray(d.who) && d.who.includes(who)))
  );
  if (!list.length) list = all.filter((d) => !type || type === "any" || d.type === type);
  if (!list.length) list = all.slice();
  list.sort((a, b) => b.rating - a.rating || a.dist - b.dist);
  res.json({ count: list.length, best: list[0] || null, data: list });
});

// POST /api/restaurants — thêm quán mới
app.post("/api/restaurants", async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.type) {
    return res.status(400).json({ error: "Cần ít nhất 'name' và 'type'." });
  }
  const list = await readJSON(RESTAURANTS_FILE, []);
  const item = {
    id: list.reduce((m, d) => Math.max(m, d.id || 0), 0) + 1,
    name: b.name,
    e: b.e || "🍽️",
    type: b.type,
    price: Number(b.price) || 0,
    rating: Number(b.rating) || 4,
    dist: Number(b.dist) || 1000,
    open: b.open !== false,
    moods: Array.isArray(b.moods) ? b.moods : [],
    who: Array.isArray(b.who) ? b.who : [],
    q: b.q || `${b.name} gần đây`,
  };
  list.push(item);
  await writeJSON(RESTAURANTS_FILE, list);
  res.status(201).json(item);
});

// =====================================================================
//  2) LỊCH SỬ & SỞ THÍCH NGƯỜI DÙNG
//     history.json: { [userId]: [ {dish, type, action, at}, ... ] }
// =====================================================================

// POST /api/history  { userId, dish, type, action }  action: eat | like | nope | change
app.post("/api/history", async (req, res) => {
  const { userId, dish, type, action = "eat" } = req.body || {};
  if (!userId || (!dish && !type)) {
    return res.status(400).json({ error: "Cần 'userId' và 'dish' hoặc 'type'." });
  }
  const all = await readJSON(HISTORY_FILE, {});
  if (!all[userId]) all[userId] = [];
  all[userId].push({ dish: dish || null, type: type || null, action, at: new Date().toISOString() });
  await writeJSON(HISTORY_FILE, all);
  res.status(201).json({ ok: true, total: all[userId].length });
});

// GET /api/history/:userId — toàn bộ lịch sử
app.get("/api/history/:userId", async (req, res) => {
  const all = await readJSON(HISTORY_FILE, {});
  res.json({ userId: req.params.userId, history: all[req.params.userId] || [] });
});

// GET /api/preferences/:userId — tổng hợp gu ăn uống
app.get("/api/preferences/:userId", async (req, res) => {
  const all = await readJSON(HISTORY_FILE, {});
  const rows = all[req.params.userId] || [];

  const typeScore = {}; // đếm theo loại (like/eat +1, nope -1)
  const dishCount = {}; // món ăn bao nhiêu lần
  for (const r of rows) {
    if (r.type) {
      const w = r.action === "nope" ? -1 : 1;
      typeScore[r.type] = (typeScore[r.type] || 0) + w;
    }
    if (r.dish && r.action !== "nope") {
      dishCount[r.dish] = (dishCount[r.dish] || 0) + 1;
    }
  }
  const favoriteTypes = Object.entries(typeScore)
    .sort((a, b) => b[1] - a[1])
    .map(([type, score]) => ({ type, score }));
  const topDishes = Object.entries(dishCount)
    .sort((a, b) => b[1] - a[1])
    .map(([dish, count]) => ({ dish, count }));

  // Gợi ý "thử món mới": loại người dùng thích nhưng món chưa ăn nhiều
  const restaurants = await readJSON(RESTAURANTS_FILE, []);
  let suggestion = null;
  const favType = favoriteTypes[0]?.type;
  if (favType) {
    const eaten = new Set(topDishes.map((d) => d.dish));
    suggestion =
      restaurants
        .filter((d) => d.type === favType && !eaten.has(d.name))
        .sort((a, b) => b.rating - a.rating)[0] || null;
  }

  res.json({ userId: req.params.userId, favoriteTypes, topDishes, suggestion });
});

// =====================================================================
//  3) GOOGLE PLACES — quán ăn thật quanh vị trí (có fallback)
//     GET /api/places?lat=..&lng=..&keyword=quán ăn&radius=1500
// =====================================================================
app.get("/api/places", async (req, res) => {
  const { lat, lng, keyword = "quán ăn", radius = 1500 } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Cần tham số 'lat' và 'lng'." });
  }

  // Không có API key → trả dữ liệu mẫu để app vẫn chạy
  if (!GOOGLE_KEY) {
    const restaurants = await readJSON(RESTAURANTS_FILE, []);
    return res.json({
      source: "fallback",
      note: "Chưa cấu hình GOOGLE_MAPS_API_KEY — đang dùng dữ liệu quán mẫu.",
      data: restaurants.slice(0, 8).map((d) => ({
        name: d.name,
        rating: d.rating,
        distance: d.dist,
        open: d.open,
        mapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(d.q)}`,
      })),
    });
  }

  // Có key → gọi Google Places API (New) - Nearby Search
  try {
    const resp = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_KEY,
        "X-Goog-FieldMask":
          "places.displayName,places.rating,places.location,places.currentOpeningHours.openNow,places.googleMapsUri",
      },
      body: JSON.stringify({
        includedTypes: ["restaurant"],
        maxResultCount: 12,
        locationRestriction: {
          circle: {
            center: { latitude: Number(lat), longitude: Number(lng) },
            radius: Number(radius),
          },
        },
      }),
    });
    const json = await resp.json();
    if (!resp.ok) {
      return res.status(502).json({ error: "Google Places lỗi", detail: json });
    }
    const data = (json.places || []).map((p) => ({
      name: p.displayName?.text || "Quán ăn",
      rating: p.rating || null,
      open: p.currentOpeningHours?.openNow ?? null,
      mapsUrl: p.googleMapsUri || null,
      location: p.location || null,
    }));
    res.json({ source: "google", keyword, radius: Number(radius), data });
  } catch (err) {
    res.status(500).json({ error: "Không gọi được Google Places", detail: String(err) });
  }
});

// ---------- start ----------
app.listen(PORT, () => {
  console.log(`🍜 Backend "Hôm Nay Ăn Gì?" chạy tại http://localhost:${PORT}`);
  console.log(`   Google Places: ${GOOGLE_KEY ? "BẬT ✅" : "TẮT (dùng fallback) ⚠️"}`);
});
