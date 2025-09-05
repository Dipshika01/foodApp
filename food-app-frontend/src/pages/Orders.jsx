import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatMoney } from "../utils/money";

const ROLE_OK = (role) => {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER";
};

const STATUS = {
  PLACED: "Placed",
  CANCELLED: "Cancelled",
  FULFILLED: "Fulfilled",
};

const API = "http://localhost:5000/api";

const IS_PAID = (o) => String(o?.paymentStatus || "").toLowerCase() === "paid";

const countryOfOrder = (o) =>
  o?.country || "India";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingOrder, setEditingOrder] = useState(null); 
  const [pmType, setPmType] = useState("COD"); 
  const [savedCards, setSavedCards] = useState([]);
  const [savedCardId, setSavedCardId] = useState("");
  const [newCard, setNewCard] = useState({
    number: "",
    exp: "",
    cvv: "",
    nickname: "",
  });
  const [upi, setUpi] = useState({ vpa: "" });
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const role = String(localStorage.getItem("role") || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const auth = { headers: token ? { Authorization: `Bearer ${token}` } : {} };

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await axios.get(`${API}/orders`, auth);
      setOrders(res.data?.orders || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      // user logged out: clear orders
      setOrders([]);
      setLoading(false);
      return;
    }
    load();
    // re-run whenever token changes
  }, [token]);

  // Cancel (Admin/Manager can cancel anything; Member only while Placed)
  const cancelOrder = async (orderNo) => {
    const order = orders.find((o) => o.orderNo === orderNo);
    if (!order) return;

    const isAllowed = ROLE_OK(role) || order.status === STATUS.PLACED;
    if (!isAllowed) {
      alert("You can only cancel orders while they are Placed.");
      return;
    }

    const reasonInput = window.prompt(
      "Reason for cancellation (optional):",
      ROLE_OK(role) ? "Admin/Manager initiated cancel" : "User requested cancel"
    );
    if (!window.confirm(`Cancel ${orderNo}?`)) return;

    try {
      await axios.post(`${API}/orders/${orderNo}/cancel`, { reason: reasonInput || "" }, auth);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || "Cancel failed");
    }
  };

  const openPaymentEditor = async (order) => {
    setEditingOrder(order.orderNo);
    setPmType(order.paymentMethod || "COD");
    setSavedCardId("");
    setNewCard({ number: "", exp: "", cvv: "", nickname: "" });
    setUpi({ vpa: "" });

    if (isAdmin) {
      try {
        const r = await axios.get(`${API}/payment-methods?type=CARD`, auth);
        const methods = Array.isArray(r.data)
          ? r.data
          : Array.isArray(r.data?.methods)
          ? r.data.methods
          : [];
        setSavedCards(methods);
      } catch {
        setSavedCards([]);
      }
    }
  };

  // Close editor
  const closePaymentEditor = () => {
    setEditingOrder(null);
    setSavedCards([]);
    setSavedCardId("");
    setNewCard({ number: "", exp: "", cvv: "", nickname: "" });
    setUpi({ vpa: "" });
    setSaving(false);
  };

  // Charge helper for CARD payments
  const chargeCard = async ({ saveCard }) => {
    const body = { orderNo: editingOrder };

    if (savedCardId) {
      body.paymentMethodId = savedCardId;
    } else {
      if (!newCard.number || !newCard.exp || !newCard.cvv) {
        throw new Error("Enter full card details or pick a saved card.");
      }
      body.card = { number: newCard.number, exp: newCard.exp, cvv: newCard.cvv };
      body.saveCard = !!saveCard;
      if (newCard.nickname) body.card.nickname = newCard.nickname;
    }

    const r = await axios.post(`${API}/payments/charge`, body, auth);
    if (!r.data?.success) throw new Error("Charge failed");
  };

  // Pay action (with or without saving card)
  const handlePay = async ({ saveCard }) => {
    if (!editingOrder) return;
    try {
      setSaving(true);

      if (!isAdmin) throw new Error("Only admins can update payment here.");
      if (pmType === "CARD") {
        await chargeCard({ saveCard });
      } else if (pmType === "UPI") {
        alert("UPI capture flow not implemented on this screen.");
      }

      await axios.put(
        `${API}/orders/${editingOrder}/payment`,
        { type: pmType, capture: true },
        auth
      );

      await load();
      closePaymentEditor();
    } catch (e) {
      alert(e.response?.data?.error || e.message || "Payment failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center">Loading…</div>;
  }
  if (err) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-red-200 bg-red-600/20 border border-red-500 rounded-xl p-4">
        {err}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-4 md:px-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">My Orders</h1>
          <p className="text-xs opacity-70">{orders.length} order{orders.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 shadow-sm">
          No orders yet.
        </div>
      )}

      {/* Orders list */}
      <div className="grid gap-4">
        {orders.map((o) => {
          const canShowCancel =
            o.status !== STATUS.CANCELLED && (ROLE_OK(role) || o.status === STATUS.PLACED);
          const isEditing = editingOrder === o.orderNo;

          const statusTone =
            o.status === STATUS.CANCELLED
              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
              : o.status === STATUS.FULFILLED || IS_PAID(o)
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200";

          const orderCountry = countryOfOrder(o);

          return (
            <div
              key={o.orderNo}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-gradient-to-b from-[#8eb7e1] via-[#dddddd] to-[#e2e2e7] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#373c49] dark:text-white shadow-sm"
            >
              {/* Summary row */}
              <div className="p-4 md:p-5 grid gap-3 md:grid-cols-[1fr,auto] md:items-start">
                {/* Left: order info */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm sm:text-base md:text-lg">
                      {o.orderNo}
                      {o.restaurantName ? (
                        <span className="ml-2 opacity-75 font-semibold text-sm sm:text-base md:text-lg">• {o.restaurantName}</span>
                      ) : null}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusTone}`}>
                      {o.status}
                    </span>
                    {IS_PAID(o) && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-600 text-white">
                        Paid
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] opacity-70 font-semibold text-sm sm:text-base">
                    Placed: {new Date(o.createdAt).toLocaleString()}
                  </p>

                  {(o.paymentMethod || o.paymentStatus || o.txnId) && (
                    <p className="text-[11px] opacity-80">
                      {o.paymentMethod ? `Method: ${o.paymentMethod}` : "Method: —"}
                      {o.paymentStatus ? ` • Status: ${o.paymentStatus}` : ""}
                      {o.txnId ? ` • Txn: ${o.txnId}` : ""}
                    </p>
                  )}
                </div>

                {/* Right: amount + actions */}
                <div className="flex md:block justify-between items-start gap-3">
                  <div className="text-right md:mb-2">
                    <p className="text-lg sm:text-xl md:text-2xl font-bold">
                      {formatMoney(o.total, orderCountry)}
                    </p>
                  </div>
{/*   ? "bg-[#e8c9c9] cursor-not-allowed" 
                        : "bg-rose-600 hover:bg-rose-500" */}
                  <div className="flex flex-wrap justify-end gap-2">
                    {canShowCancel && (
                      <button
                        onClick={() => cancelOrder(o.orderNo)}
                        className="px-3 py-1.5 rounded-md bg-[#ba2b2b] hover:bg-rose-500 text-white text-xs" 
                      >
                        Cancel
                      </button>
                    )}

                    {isAdmin && o.status !== STATUS.CANCELLED && !IS_PAID(o) && (
                      <button
                        onClick={() => (isEditing ? closePaymentEditor() : openPaymentEditor(o))}
                        className="px-3 py-1.5 rounded-md bg-[#1b5aa5] hover:bg-[#0651ac] text-[#d5dce9] text-sm
                               dark:bg-[#24548f] dark:hover:bg-[#e31a1a]"
                        title="Change payment method (Admin)"
                      >
                        {isEditing ? "Close" : "Update Payment"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Editor */}
              {isAdmin && isEditing && (
                <div className="border-t border-black/10 dark:border-white/10 p-4 md:p-5 bg-slate-50/60 dark:bg-slate-900/40 rounded-b-2xl">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Column 1: method + saved card */}
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Method</label>
                        <select
                          className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                          value={pmType}
                          onChange={(e) => setPmType(e.target.value)}
                        >
                          <option value="CARD">Card</option>
                          <option value="UPI">UPI</option>
                          <option value="COD">COD</option>
                        </select>
                      </div>

                      {pmType === "CARD" && (
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Saved cards</label>
                          <select
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                            value={savedCardId}
                            onChange={(e) => setSavedCardId(e.target.value)}
                          >
                            <option value="">— Select saved card —</option>
                            {savedCards.map((c) => (
                              <option key={c._id} value={c._id}>
                                {(c.nickname || c.brand || c.details?.brand || "Card") +
                                  " •••• " +
                                  (c.last4 || c.details?.last4 || "")}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {pmType === "UPI" && (
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">UPI ID</label>
                          <input
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                            placeholder="yourid@bank"
                            value={upi.vpa}
                            onChange={(e) => setUpi({ vpa: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    {/* Column 2: new card */}
                    {pmType === "CARD" && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">New card</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                            placeholder="Card number"
                            value={newCard.number}
                            onChange={(e) =>
                              setNewCard((x) => ({ ...x, number: e.target.value }))
                            }
                            disabled={!!savedCardId}
                          />
                          <input
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                            placeholder="MM/YY"
                            value={newCard.exp}
                            onChange={(e) =>
                              setNewCard((x) => ({ ...x, exp: e.target.value }))
                            }
                            disabled={!!savedCardId}
                          />
                          <input
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                            placeholder="CVV"
                            value={newCard.cvv}
                            onChange={(e) =>
                              setNewCard((x) => ({ ...x, cvv: e.target.value }))
                            }
                            disabled={!!savedCardId}
                          />
                          <input
                            className="p-2 rounded-md bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10"
                            placeholder="Nickname (optional)"
                            value={newCard.nickname}
                            onChange={(e) =>
                              setNewCard((x) => ({ ...x, nickname: e.target.value }))
                            }
                            disabled={!!savedCardId}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <button
                      onClick={() => handlePay({ saveCard: true })}
                      disabled={saving || pmType === "COD"}
                      className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm disabled:opacity-60"
                    >
                      {saving ? "Processing…" : "Save & Pay"}
                    </button>
                    <button
                      onClick={() => handlePay({ saveCard: false })}
                      disabled={saving || pmType === "COD"}
                      className="px-4 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm disabled:opacity-60"
                    >
                      {saving ? "Processing…" : "Pay"}
                    </button>
                    <button
                      onClick={closePaymentEditor}
                      className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
