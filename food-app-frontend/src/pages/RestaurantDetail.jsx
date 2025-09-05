import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/money";

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, add, dec, removeItem, restaurant: cartRestaurant } = useCart();

  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");

  // tiny toast
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast({ msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 1400);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:5000/api/restaurants/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRestaurant(res.data?.restaurant || null);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.error || err.message || "Failed to load restaurant";
        setError(`Failed to load restaurant (${status || "no-status"}): ${msg}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, navigate]);

  const restId = useMemo(() => restaurant && (restaurant.id || restaurant._id), [restaurant]);

  const getQty = (menuItem) => {
    const itemId = menuItem.itemId || menuItem.id || menuItem._id;
    const row = (cart || []).find(
      (c) =>
        c.restaurantId === restId &&
        (c.itemId === itemId ||
          c.itemId === (menuItem.id || menuItem._id) ||
          c.itemId === menuItem.itemId)
    );
    return row?.qty || 0;
  };

  // ⬇️ single-restaurant guard when adding
  const onPlus = async (m) => {
    if (!restaurant) return;
    const meta = { name: restaurant.name, country: restaurant.country };

    const result = add(restId, m, meta); // try normal add
    if (result?.ok) {
      showToast(`${m.name} added to cart`);
      return;
    }

    if (result?.reason === "DIFF_RESTAURANT") {
      const curr = result.currentRestaurant;
      const next = result.newRestaurant;
      const confirmSwitch = window.confirm(
        `Your cart has items from “${curr?.name || "another restaurant"}”.\n\n` +
        `Switch to “${next?.name || "this restaurant"}”? This will clear your existing cart.`
      );
      if (confirmSwitch) {
        const forced = add(restId, m, meta, { force: true });
        if (forced?.ok) showToast(`Cart cleared. Added ${m.name}.`);
      } else {
        showToast("Cart unchanged.");
      }
    }
  };

  const onMinus = (m) => {
    const id = m.itemId || m.id || m._id || String(m.name || "");
    // dec by itemId (context supports this signature)
    dec(id);
    showToast(`Removed 1 × ${m.name}`);
  };

  if (loading) return <div className="min-h-[60vh] grid place-items-center">Loading…</div>;
  if (error) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-red-200 bg-red-600/20 border border-red-500 rounded-xl p-4">
        {error}
      </div>
    );
  }
  if (!restaurant) return <div className="p-4">Restaurant not found.</div>;

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className="fixed right-4 top-20 z-40 px-3 py-2 rounded-lg bg-black/80 text-white text-xs shadow-lg">
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{restaurant.name}</h1>
          <p className="text-xs text-gray-700 dark:text-white/60">
            {restaurant.cuisine} • {restaurant.city}
            {restaurant.country ? ` • ${restaurant.country}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/restaurants" className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm">
            Back
          </Link>
          <Link to="/cart" className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
            Cart
          </Link>
        </div>
      </div>

      {/* Menu grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(restaurant.menu || []).map((m) => {
          const key = m.id || m._id || `${m.name}-${m.price}`;
          const qty = getQty(m);

          return (
            <div
              key={key}
              className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#4a8ed3] via-[#7e5dbf] to-[#adadcc]
                         dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] dark:text-white
                         border border-black/5 dark:border-white/10 flex flex-col hover:shadow-lg transition"
            >
              <div className="w-full h-48 sm:h-56">
                {m.image ? (
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full bg-white/10 dark:bg-white/5" />
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col gap-3">
                <div>
                  <p className="font-medium">{m.name}</p>
                  {m.description && <p className="text-xs text-black/80 dark:text-white/70">{m.description}</p>}
                  <p className="text-sm mt-1">{formatMoney(m.price, restaurant.country)}</p>
                </div>

                {qty > 0 ? (
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onMinus(m)}
                        className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-lg grid place-items-center"
                        aria-label={`decrease ${m.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-medium">{qty}</span>
                      <button
                        onClick={() => onPlus(m)}
                        className="w-9 h-9 rounded-lg bg-[#3c6495] hover:bg-[#0651ac] text-white text-lg grid place-items-center"
                        aria-label={`increase ${m.name}`}
                      >
                        +
                      </button>
                    </div>
                    <Link to="/cart" className="text-xs px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white">
                      Cart
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => onPlus(m)}
                    className="mt-auto px-3 py-2 rounded-lg bg-[#3c6495] hover:bg-[#0651ac] text-white text-sm
                               dark:bg-[#ba3f3f] dark:hover:bg-[#e31a1a]"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
