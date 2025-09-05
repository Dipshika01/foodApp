import express from "express";
import { requireAuth } from "../middleware/auth.js";
import Order from "../models/Order.js";
import PaymentMethod from "../models/PaymentMethod.js";

const router = express.Router();

/**
 * Body: { orderNo, paymentMethodId? }
 * Effect: validates ownership, checks a payment method for the user's country,
 * marks order as 'paid' with a fake txn id.
 */
router.post("/payments/charge", requireAuth, async (req, res) => {
  try {
    const { orderNo, paymentMethodId, card, saveCard } = req.body || {};
    if (!orderNo) return res.status(400).json({ error: "orderNo required" });

    // You may wish to allow ADMIN/MANAGER to charge any order;
    // here we just require the logged-in user matches the order owner:
    const order = await Order.findOne({ orderNo, userId: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status === "Cancelled")
      return res.status(400).json({ error: "Order is cancelled" });

    if (order.paymentStatus === "paid")
      return res.status(400).json({ error: "Order already paid" });

    let pmDoc = null;

    if (paymentMethodId) {
      // Use a saved method owned by the user
      pmDoc = await PaymentMethod.findOne({
        _id: paymentMethodId,
        createdBy: req.user.id,
      });
      if (!pmDoc) return res.status(400).json({ error: "Saved card not found" });
      if (pmDoc.type !== "CARD")
        return res.status(400).json({ error: "Only CARD is supported here" });
    } else if (card?.number && card?.exp && card?.cvv) {
      // Use a new card; optionally save it
      const digits = String(card.number).replace(/\D/g, "");
      if (digits.length < 12) return res.status(400).json({ error: "Invalid card number" });

      const brand = digits.startsWith("4") ? "VISA" : "CARD";

      if (saveCard) {
        pmDoc = await PaymentMethod.create({
          nickname: `${brand} •••• ${digits.slice(-4)}`,
          type: "CARD",
          country: req.user.country,     // "India" or "America"
          isDefault: false,
          details: { brand, last4: digits.slice(-4), exp: card.exp },
          createdBy: req.user.id,
        });
      }
      // (even if not saved, we can still “charge” the card)
    } else {
      return res
        .status(400)
        .json({ error: "Provide paymentMethodId or card details" });
    }

    // ---- fake processor success ----
    const txnId = `CARD-${Date.now()}`;

    // IMPORTANT: do not touch order.status here
    order.paymentMethod = "CARD";
    order.paymentStatus = "paid";
    order.txnId = txnId;
    order.paidAt = new Date();
    await order.save();

    res.json({ success: true, order, txnId, savedMethodId: pmDoc?._id || null });
  } catch (err) {
    console.error("charge failed", err);
    res.status(500).json({ error: "Charge failed" });
  }
});

router.get("/payments/methods", requireAuth, async (req, res) => {
  try {
    const type = String(req.query.type || "").toUpperCase(); // e.g. CARD, UPI
    const q = { createdBy: req.user.id };

    if (type && ["CARD", "UPI", "BANK"].includes(type)) {
      q.type = type;
    }

    const methods = await PaymentMethod.find(q).sort({ createdAt: -1 }).lean();
    res.json({ methods });
  } catch (err) {
    console.error("list methods failed", err);
    res.status(500).json({ error: "Failed to load saved methods" });
  }
});

export default router;
