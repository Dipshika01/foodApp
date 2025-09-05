import express from "express";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";
import { requireAuth } from "../middleware/auth.js";
import CancelledOrder from "../models/CancelledOrder.js";
import mongoose from "mongoose";
import { requireRole } from "../middleware/roles.js";
import PaymentMethod from "../models/PaymentMethod.js";
import Restaurant from "../models/Restaurant.js";

const router = express.Router();

const isAdmin = (req) => String(req.user?.role || "").toUpperCase() === "ADMIN";
const isManager = (req) => String(req.user?.role || "").toUpperCase() === "MANAGER";

const toPrice = (v) => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v || "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const brandOf = (num = "") => {
  const s = String(num).replace(/\D/g, "");
  if (/^4/.test(s)) return "VISA";
  if (/^5[1-5]/.test(s)) return "MASTERCARD";
  if (/^3[47]/.test(s)) return "AMEX";
  if (/^6(0|5)/.test(s)) return "DISCOVER";
  if (/^35/.test(s)) return "JCB";
  if (/^81/.test(s) || /^60/.test(s)) return "RUPAY";
  return "CARD";
};

async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc.seq;
}

/** Checkout — stamp order.country for later scoping */

router.post("/orders/checkout", requireAuth, async (req, res) => {
  try {
    const { items = [], paymentMethod, card, upi, savedCardId, saveCard } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const pm = String(paymentMethod || "").toUpperCase();
    if (!["COD", "CARD", "UPI"].includes(pm)) {
      return res.status(400).json({ error: "Select a valid payment method" });
    }

    // normalize items
    const normalized = items.map((it) => ({
      restaurantId: String(it.restaurantId || ""),
      itemId:       String(it.itemId || ""),
      name:         String(it.name || ""),
      price:        toPrice(it.price),
      qty:          Math.max(1, parseInt(it.qty || 1, 10)),
    }));

    // all items must have a restaurantId
    if (normalized.some((it) => !it.restaurantId)) {
      return res.status(400).json({ error: "Each item must include restaurantId" });
    }

    // enforce single-restaurant cart
    const uniqRestaurantIds = [...new Set(normalized.map((it) => it.restaurantId))];
    if (uniqRestaurantIds.length !== 1) {
      return res
        .status(400)
        .json({ error: "Your cart contains items from multiple restaurants. Please clear the cart and add items from one restaurant only." });
    }
    const restaurantId = uniqRestaurantIds[0];

    // look up restaurant for name & country
    const rDoc = await Restaurant.findById(restaurantId).lean();
    if (!rDoc) {
      return res.status(400).json({ error: "Restaurant not found" });
    }
    const restaurantName = rDoc.name || "";
    const country = rDoc.country || "India"; // default if your data is missing

    // total
    const total = normalized.reduce((s, it) => s + it.price * it.qty, 0);

    // ---- fake payment processor (unchanged) ----
    let paymentStatus = "cod";
    let txnId = "";
    let paidAt = null;

    if (pm === "CARD") {
      if (savedCardId) {
        const pmDoc = await PaymentMethod.findOne({ _id: savedCardId, createdBy: req.user.id });
        if (!pmDoc) return res.status(400).json({ error: "Saved card not found" });
        paymentStatus = "paid";
        txnId = "CARD-" + Date.now();
        paidAt = new Date();
      } else if (card?.number && card?.exp && card?.cvv) {
        const digits = String(card.number).replace(/\D/g, "");
        if (digits.length < 12) return res.status(400).json({ error: "Invalid card" });
        if (saveCard) {
          await PaymentMethod.create({
            nickname: `${brandOf(digits)} •••• ${digits.slice(-4)}`,
            type: "CARD",
            country: req.user.country, // card’s country can remain tied to user
            isDefault: false,
            details: { brand: brandOf(digits), last4: digits.slice(-4), exp: card.exp },
            createdBy: req.user.id,
          });
        }
        paymentStatus = "paid";
        txnId = "CARD-" + Date.now();
        paidAt = new Date();
      } else {
        return res.status(400).json({ error: "Provide a savedCardId or full card details" });
      }
    } else if (pm === "UPI") {
      const vpa = String(upi?.vpa || "");
      if (!/^[\w.\-]+@[\w\-]+$/.test(vpa)) {
        return res.status(400).json({ error: "Invalid UPI ID" });
      }
      paymentStatus = "paid";
      txnId = "UPI-" + Date.now();
      paidAt = new Date();
    }

    const seq = await nextSeq("order");
    const orderNo = `FOODAPP-${seq}`;

    // ⬇️ Save restaurant fields + country from the restaurant doc
    const order = await Order.create({
      orderNo,
      userId: req.user.id,

      restaurantId,
      restaurantName,          // add this field in your schema if not present
      country,                 // use restaurant’s country (drives ₹/$ in UI)

      items: normalized,
      total,
      status: "Placed",
      paymentMethod: pm,
      paymentStatus,
      txnId,
      paidAt,
    });

    return res.json({ orderNo: order.orderNo, order });
  } catch (err) {
    console.error("checkout failed", err);
    return res.status(500).json({ error: "Checkout failed" });
  }
});

/** My orders — keep user-scoped; country matches implicitly */
router.get("/orders", requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    console.error("fetch orders failed", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/** Cancel — Admin can cancel any; Manager only in own country; Member only own */
router.post("/orders/:id/cancel", requireAuth, async (req, res) => {
  try {
    const role = String(req.user.role || "").toUpperCase();
    if (!(role === "ADMIN" || role === "MANAGER")) {
      return res.status(403).json({ error: "Only Admin/Manager can cancel" });
    }

    const { id } = req.params; // orderNo
    const reason = String(req.body?.reason || "");

    const userObjectId = (() => {
      try { return new mongoose.Types.ObjectId(req.user.id); } catch { return null; }
    })();
    if (!userObjectId) return res.status(400).json({ error: "Invalid user id in token" });

    // get the order
    const order = await Order.findOne({ orderNo: id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Managers can cancel only within their country
    if (role === "MANAGER" && String(order.country) !== String(req.user.country)) {
      return res.status(403).json({ error: "Forbidden (cross-country)" });
    }

    if (order.status === "Cancelled") {
      return res.status(409).json({ error: "Order already cancelled" });
    }

    const cancelledDoc = await CancelledOrder.findOneAndUpdate(
      { orderNo: order.orderNo },
      {
        $setOnInsert: {
          orderNo: order.orderNo,
          userId: order.userId,
          items: order.items,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          txnId: order.txnId,
          paidAt: order.paidAt,
          country: order.country || req.user.country,
        },
        $set: {
          statusAtCancel: order.status,
          cancelledAt: new Date(),
          cancelledBy: userObjectId,
          cancelReason: reason,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    order.status = "Cancelled";
    await order.save();

    return res.json({ success: true, order, cancelled: cancelledDoc });
  } catch (err) {
    console.error("cancel failed", err);
    if (err?.code === 11000) return res.json({ success: true, dup: true });
    return res.status(500).json({ error: "Cancel failed" });
  }
});


/** Cancelled orders list — Admin: all, Manager: country-only */
router.get("/orders/cancelled", requireAuth, async (req, res) => {
  const role = String(req.user.role || "").toUpperCase();
  if (!(role === "ADMIN" || role === "MANAGER")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const filter = role === "ADMIN" ? {} : { country: req.user.country };
  const docs = await CancelledOrder.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ cancelled: docs });
});

/** Update payment — ADMIN only (kept as-is); if you want managers, add country guard */
router.put("/orders/:orderNo/payment", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { type, capture } = req.body || {};

    const METHOD = String(type || "").toUpperCase();
    if (!["COD", "CARD", "UPI"].includes(METHOD)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    const order = await Order.findOne({ orderNo });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status === "Cancelled") return res.status(400).json({ error: "Order is cancelled" });

    order.paymentMethod = METHOD;

    if (capture && (METHOD === "CARD" || METHOD === "UPI")) {
      order.paymentStatus = "paid";
      order.txnId = `${METHOD}-${Date.now()}`;
      order.paidAt = new Date();
    } else if (METHOD === "COD") {
      order.paymentStatus = "cod";
      order.txnId = "";
      order.paidAt = null;
    }

    await order.save();
    return res.json({ success: true, order });
  } catch (err) {
    console.error("update payment failed", err);
    return res.status(500).json({ error: "Update payment failed" });
  }
});

/** Payment methods — per-user already; no change needed */
router.get("/payment-methods", requireAuth, async (req, res) => {
  const type = String(req.query.type || "").toUpperCase();
  const q = { createdBy: req.user.id };
  if (type) q.type = type;
  const docs = await PaymentMethod.find(q).sort({ createdAt: -1 }).lean();
  const methods = docs.map((d) => ({
    _id: d._id,
    nickname: d.nickname,
    last4: d.details?.last4,
    brand: d.details?.brand || "CARD",
  }));
  res.json({ methods });
});

export default router;
