// src/pages/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/money";


const canCheckout = (role) =>
  ["ADMIN", "MANAGER"].includes(String(role || "").toUpperCase());

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clear, total, restaurant } = useCart(); // restaurant may be null

  const token = localStorage.getItem("token");
  const role = String(localStorage.getItem("role") || "").toUpperCase();

  // axios with auth
  const api = useMemo(() => {
    const base =
      (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api";
    const c = axios.create({ baseURL: base });
    c.interceptors.request.use((cfg) => {
      cfg.headers ||= {};
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
    return c;
  }, [token]);

  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState(""); // "COD" | "CARD" | "UPI"

  // CARD state
  const [useSavedCard, setUseSavedCard] = useState(true);
  const [savedCards, setSavedCards] = useState([]);
  const [savedCardId, setSavedCardId] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvv: "" });
  const [saveCard, setSaveCard] = useState(false);

  // UPI state
  const [upi, setUpi] = useState({ vpa: "" });

  // ---- Derive restaurant meta robustly from cart ----
  const uniqueRestIds = Array.from(
    new Set((cart || []).map((c) => c.restaurantId).filter(Boolean))
  );

  const restId =
    restaurant?._id ||
    restaurant?.id ||
    uniqueRestIds[0] ||
    ""; // must not be empty

  const restName =
    restaurant?.name ||
    (cart || []).find((c) => c.restaurantName)?.restaurantName ||
    "";

  const country =
    restaurant?.country ||
    (cart || []).find((c) => c.country)?.country ||
    localStorage.getItem("country") ||
    "India";

  // Guard: only one restaurant in cart
  const multiRestaurant = uniqueRestIds.length > 1;

  // Load saved cards when CARD is selected
  useEffect(() => {
    const fetchSavedCards = async () => {
      if (method !== "CARD") return;
      try {
        const res = await api.get("/payment-methods?type=CARD");
        const items = Array.isArray(res.data?.methods) ? res.data.methods : [];
        setSavedCards(items);
        if (items.length) setSavedCardId(items[0]._id);
      } catch {
        setSavedCards([]);
      }
    };
    fetchSavedCards();

    // reset on method change
    setUseSavedCard(true);
    setSavedCardId("");
    setCard({ number: "", exp: "", cvv: "" });
    setSaveCard(false);
    setUpi({ vpa: "" });
  }, [method, api]);

  const placeOrder = async () => {
    if (!canCheckout(role)) return alert("Only Admin/Manager can checkout.");
    if (!cart || cart.length === 0) return alert("Cart is empty.");
    if (multiRestaurant)
      return alert("Your cart has items from multiple restaurants. Please clear the cart and add items from only one restaurant.");

    if (!restId) return alert("Missing restaurant info. Please re-add items.");

    if (!method) return alert("Select a payment method.");

    if (method === "CARD") {
      if (useSavedCard) {
        if (!savedCardId) return alert("Choose a saved card.");
      } else if (!card.number || !card.exp || !card.cvv) {
        return alert("Enter card number, expiry (MM/YY) and CVV.");
      }
    }
    if (method === "UPI" && !upi.vpa) return alert("Enter a valid UPI ID.");

    try {
      setLoading(true);

      // ✅ include restaurantId, restaurantName, country
      const payload = {
        restaurantId: restId,
        restaurantName: restName || "",
        country, // America | India
        items: (cart || []).map((c) => ({
          restaurantId: c.restaurantId,
          restaurantName: c.restaurantName, // optional, good to keep on item too
          itemId: c.itemId,
          name: c.name,
          price: c.price,
          qty: c.qty,
        })),
        paymentMethod: method,
      };

      if (method === "CARD") {
        if (useSavedCard) payload.savedCardId = savedCardId;
        else {
          payload.card = card;
          payload.saveCard = !!saveCard;
        }
      } else if (method === "UPI") {
        payload.upi = upi;
      }

      const res = await api.post("/orders/checkout", payload);

      clear();
      alert(`Order placed! #${res.data?.orderNo || res.data?.order?.orderNo || ""}`);
      navigate("/orders");
    } catch (err) {
      alert(err.response?.data?.error || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !cart || cart.length === 0 || multiRestaurant;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Checkout</h1>

      <div className="rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10 p-5 space-y-4">
        {multiRestaurant && (
          <div className="text-sm text-rose-600 dark:text-rose-300">
            Your cart has items from multiple restaurants. Please clear the cart and add items from a single restaurant.
          </div>
        )}

        <div className="text-sm text-gray-700 dark:text-white/70">
          Total amount:{" "}
          <span className="font-semibold">{formatMoney(total, country)}</span>
          {restName ? <span className="opacity-70"> • {restName}</span> : null}
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment Method</p>
          <div className="flex flex-wrap gap-4">
            {["COD", "CARD", "UPI"].map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="pm"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                />
                <span>{m === "COD" ? "Cash on Delivery" : m}</span>
              </label>
            ))}
          </div>
        </div>

        {/* CARD section */}
        {method === "CARD" && (
          <div className="space-y-3">
            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={useSavedCard}
                  onChange={() => setUseSavedCard(true)}
                />
                Use saved card
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!useSavedCard}
                  onChange={() => setUseSavedCard(false)}
                />
                New card
              </label>
            </div>

            {useSavedCard ? (
              <label className="text-sm block">
                Saved cards
                <select
                  className="mt-1 w-full p-2 rounded bg-white/80 dark:bg-slate-800 border border-black/10 dark:border-white/10"
                  value={savedCardId}
                  onChange={(e) => setSavedCardId(e.target.value)}
                >
                  {savedCards.length === 0 && <option value="">No saved cards</option>}
                  {savedCards.map((c) => (
                    <option key={c._id} value={c._id}>
                      {(c.nickname || c.brand || "Card") + " •••• " + (c.last4 || "????")}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    className="p-2 rounded bg-white/80 dark:bg-slate-800"
                    placeholder="Card Number"
                    value={card.number}
                    onChange={(e) => setCard((x) => ({ ...x, number: e.target.value }))}
                  />
                  <input
                    className="p-2 rounded bg-white/80 dark:bg-slate-800"
                    placeholder="MM/YY"
                    value={card.exp}
                    onChange={(e) => setCard((x) => ({ ...x, exp: e.target.value }))}
                  />
                  <input
                    className="p-2 rounded bg-white/80 dark:bg-slate-800"
                    placeholder="CVV"
                    value={card.cvv}
                    onChange={(e) => setCard((x) => ({ ...x, cvv: e.target.value }))}
                  />
                </div>

                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={saveCard}
                    onChange={(e) => setSaveCard(e.target.checked)}
                  />
                  Save this card for future orders
                </label>
              </>
            )}
          </div>
        )}

        {/* UPI section */}
        {method === "UPI" && (
          <label className="text-sm block">
            UPI ID (VPA)
            <input
              className="mt-1 p-2 w-full rounded bg-white/80 dark:bg-slate-800"
              placeholder="yourid@bank"
              value={upi.vpa}
              onChange={(e) => setUpi({ vpa: e.target.value })}
            />
          </label>
        )}

        <div className="flex gap-2">
          <button
            onClick={placeOrder}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg text-white ${
              disabled
                ? "bg-indigo-400/40 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {loading ? "Processing…" : method === "COD" ? "Place Order" : "Pay & Place Order"}
          </button>
          <button
            onClick={() => navigate("/cart")}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            Back to Cart
          </button>
        </div>

        {!canCheckout(role) && (
          <p className="text-xs text-rose-400">Your role can’t place orders.</p>
        )}
      </div>
    </div>
  );
}
