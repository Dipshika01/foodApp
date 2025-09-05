import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../utils/money";

export default function Cart() {
  const { cart, dec, removeItem, clear, total, restaurant } = useCart();
  const navigate = useNavigate();

  const country = restaurant?.country; // America/India
  const titleSuffix = restaurant?.name ? ` • ${restaurant.name}` : "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Your Cart{titleSuffix}</h1>
        <button onClick={() => navigate("/restaurants")} className="text-sm underline">
          Continue shopping
        </button>
      </div>

      {(cart || []).length === 0 ? (
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10">
          Cart is empty.
        </div>
      ) : (
        <div className="space-y-3">
          {(cart || []).map((c) => (
            <div
              key={c.itemId}
              className="flex items-center justify-between p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                {/* Show the restaurant name under the item too (redundant but explicit) */}
                <p className="text-[11px] opacity-70">
                  {restaurant?.name || c.restaurantName || ""}
                </p>
                <p className="text-xs text-gray-600 dark:text-white/60">
                  {formatMoney(Number(c.price).toFixed(2), country)} × {c.qty}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => dec(c.itemId)}
                  className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-xs text-white"
                >
                  −
                </button>
                <button
                  onClick={() => removeItem(c.itemId)}
                  className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-xs text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm">Total</span>
            <span className="text-lg font-bold">
              {formatMoney(Number(total).toFixed(2), country)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => navigate("/checkout")}
              disabled={(cart || []).length === 0}
              className={`px-4 py-2 rounded-lg text-white ${
                (cart || []).length === 0
                  ? "bg-indigo-400/40 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500"
              }`}
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clear}
              disabled={(cart || []).length === 0}
              className={`px-4 py-2 rounded-lg text-white ${
                (cart || []).length === 0
                  ? "bg-slate-700/60 cursor-not-allowed"
                  : "bg-slate-700 hover:bg-slate-600"
              }`}
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
