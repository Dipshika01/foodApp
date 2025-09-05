// routes/restaurants.js
import express from "express";
import Restaurant from "../models/Restaurant.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import mongoose from "mongoose";

const router = express.Router();
const isAdmin = (req) => String(req.user?.role || "").toUpperCase() === "ADMIN";

function normalizeCategories(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  return String(val).split(",").map(s => s.trim()).filter(Boolean);
}

/** Create restaurant — ADMIN only */
router.post("/restaurants", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, cuisine, city, country, coverImage, categories } = req.body;
    if (!name || !country) return res.status(400).json({ error: "name & country required" });

    const doc = await Restaurant.create({
      name,
      cuisine,
      city,
      country,
      coverImage,
      menu: [],
      categories: normalizeCategories(categories),
    });

    res.json({ restaurant: doc });
  } catch (e) {
    console.error("create restaurant failed", e);
    res.status(500).json({ error: "Create restaurant failed" });
  }
});

/** List restaurants — ALL roles; Admin sees all, others own country */
router.get("/restaurants", requireAuth, async (req, res) => {
  try {
    const filter = isAdmin(req) ? {} : { country: req.user.country };
    const docs = await Restaurant.find(filter).lean();

    const restaurants = docs.map((r) => ({
      id: String(r._id),
      name: r.name,
      cuisine: r.cuisine || "",
      city: r.city || "",
      country: r.country || "",
      coverImage: r.coverImage || "",
      categories: Array.isArray(r.categories) ? r.categories : [],
      menu: (r.menu || []).map((m, idx) => ({
        id: m.id || `${r._id}-${idx}`,
        name: m.name,
        description: m.description || "",
        price: Number(m.price || 0),
      })),
    }));

    res.json({ restaurants });
  } catch (err) {
    console.error("GET /restaurants failed", err);
    res.status(500).json({ error: "Server error loading restaurants" });
  }
});

/** Get one — ALL roles; non-admins limited to their country */
router.get("/restaurants/:id", requireAuth, async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ error: "Not found" });
    if (!isAdmin(req) && r.country !== req.user.country) {
      return res.status(404).json({ error: "Not found" }); // hide cross-country
    }

    const restaurant = {
      id: String(r._id),
      name: r.name,
      cuisine: r.cuisine || "",
      city: r.city || "",
      country: r.country || "",
      coverImage: r.coverImage || "",
      categories: Array.isArray(r.categories) ? r.categories : [],
      menu: (r.menu || []).map((m, idx) => ({
        id: m.id || `${r._id}-${idx}`,
        name: m.name,
        description: m.description || "",
        price: Number(m.price || 0),
        image: m.image || "",
      })),
    };

    res.json({ restaurant });
  } catch (err) {
    console.error("get restaurant by id failed", err);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

/** Add menu item — ADMIN, MANAGER, MEMBER; non-admins must match country */
router.post(
  "/restaurants/:id/menu",
  requireAuth,
  requireRole("ADMIN", "MANAGER", "MEMBER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { itemId, name, description, price, image } = req.body;
      if (!name || price == null) return res.status(400).json({ error: "name, price required" });

      const r = await Restaurant.findById(id);
      if (!r) return res.status(404).json({ error: "Restaurant not found" });
      if (!isAdmin(req) && r.country !== req.user.country) {
        return res.status(403).json({ error: "Forbidden (cross-country)" });
      }

      const finalItemId = itemId || new mongoose.Types.ObjectId().toString();
      if (r.menu.some((m) => m.id === finalItemId)) {
        return res.status(409).json({ error: "Menu item with same id exists" });
      }

      r.menu.push({
        id: finalItemId,
        name,
        description: description || "",
        price: Number(price),
        image: image || "",
      });

      await r.save();
      res.json({ restaurant: r });
    } catch (e) {
      console.error("add menu failed", e);
      res.status(500).json({ error: "Add menu item failed" });
    }
  }
);

/** Update menu item — ADMIN, MANAGER, MEMBER; country check for non-admin */
router.put(
  "/restaurants/:id/menu/:itemId",
  requireAuth,
  requireRole("ADMIN", "MANAGER", "MEMBER"),
  async (req, res) => {
    try {
      const { id, itemId } = req.params;
      const { name, description, price, image } = req.body;

      const r = await Restaurant.findById(id);
      if (!r) return res.status(404).json({ error: "Restaurant not found" });
      if (!isAdmin(req) && r.country !== req.user.country) {
        return res.status(403).json({ error: "Forbidden (cross-country)" });
      }

      const it = r.menu.find((m) => m.id === itemId || m.name === itemId);
      if (!it) return res.status(404).json({ error: "Menu item not found" });

      if (name != null) it.name = name;
      if (description != null) it.description = description;
      if (price != null) it.price = Number(price);
      if (image != null) it.image = image;

      await r.save();
      res.json({ restaurant: r });
    } catch (e) {
      console.error("update menu failed", e);
      res.status(500).json({ error: "Update menu item failed" });
    }
  }
);

/** Delete menu item — ADMIN, MANAGER, MEMBER; country check for non-admin */
router.delete(
  "/restaurants/:id/menu/:itemId",
  requireAuth,
  requireRole("ADMIN", "MANAGER", "MEMBER"),
  async (req, res) => {
    try {
      const { id, itemId } = req.params;

      const r = await Restaurant.findById(id);
      if (!r) return res.status(404).json({ error: "Restaurant not found" });
      if (!isAdmin(req) && r.country !== req.user.country) {
        return res.status(403).json({ error: "Forbidden (cross-country)" });
      }

      r.menu = r.menu.filter((m) => !(m.id === itemId || m.name === itemId));
      await r.save();
      res.json({ restaurant: r });
    } catch (e) {
      console.error("delete menu failed", e);
      res.status(500).json({ error: "Delete menu item failed" });
    }
  }
);
/** Delete restaurant — ADMIN only */
router.delete("/restaurants/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Restaurant.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: "Restaurant not found" });
    // If you want to prevent deleting restaurants that appear in existing orders,
    // you could add a check here against Order collection before deletion.
    return res.json({ success: true });
  } catch (e) {
    console.error("delete restaurant failed", e);
    return res.status(500).json({ error: "Delete failed" });
  }
});
export default router;
