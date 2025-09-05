import React, { createContext, useContext, useMemo, useState } from "react";

const CartContext = createContext(null);

function stableItemId(item) {
  return item.itemId || item.id || item._id || String(item.name || "");
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem("cart_v2");
    if (!raw) return { items: [], restaurant: null };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items)) parsed.items = [];
    return { items: parsed.items, restaurant: parsed.restaurant || null };
  } catch {
    return { items: [], restaurant: null };
  }
}

export default function CartProvider({ children }) {
  const [items, setItems] = useState(() => loadPersisted().items);
  const [restaurant, setRestaurant] = useState(() => loadPersisted().restaurant); // {id, name, country} | null

  const persist = (nextItems, nextRestaurant) => {
    setItems(nextItems);
    setRestaurant(nextRestaurant);
    localStorage.setItem(
      "cart_v2",
      JSON.stringify({ items: nextItems, restaurant: nextRestaurant })
    );
  };

  const clear = () => persist([], null);

  /**
   * Add/increment an item.
   * @param {string} restId - restaurant id
   * @param {object} item   - menu item ({ id/_id/itemId, name, price, ... })
   * @param {object} meta   - { name, country }
   * @param {object} opts   - { force?: boolean } if true, clears and adds even if restaurant differs
   * @returns {{ok:boolean, reason?:string, currentRestaurant?:any, newRestaurant?:any}}
   */
  const add = (restId, item, meta = {}, opts = {}) => {
    const newItemId = stableItemId(item);
    const priceNum =
      typeof item.price === "number"
        ? item.price
        : parseFloat(String(item.price || "").replace(/[^0-9.]/g, "")) || 0;

    // Empty cart → initialize with restaurant meta
    if (!restaurant || items.length === 0) {
      const nextItems = [
        {
          restaurantId: restId,
          restaurantName: meta.name || "",
          restaurantCountry: meta.country || "",
          itemId: newItemId,
          name: item.name || "",
          price: priceNum,
          qty: 1,
        },
      ];
      const nextRestaurant = { id: restId, name: meta.name || "", country: meta.country || "" };
      persist(nextItems, nextRestaurant);
      return { ok: true };
    }

    // Different restaurant guard
    if (restaurant.id !== restId) {
      if (opts.force) {
        // Clear and add fresh
        const nextItems = [
          {
            restaurantId: restId,
            restaurantName: meta.name || "",
            restaurantCountry: meta.country || "",
            itemId: newItemId,
            name: item.name || "",
            price: priceNum,
            qty: 1,
          },
        ];
        const nextRestaurant = { id: restId, name: meta.name || "", country: meta.country || "" };
        persist(nextItems, nextRestaurant);
        return { ok: true };
      }
      return {
        ok: false,
        reason: "DIFF_RESTAURANT",
        currentRestaurant: restaurant,
        newRestaurant: { id: restId, name: meta.name || "", country: meta.country || "" },
      };
    }

    // Same restaurant → increment or add
    const next = items.map((x) => ({ ...x })); // shallow copy
    const idx = next.findIndex((x) => x.itemId === newItemId);
    if (idx >= 0) {
      next[idx].qty += 1;
    } else {
      next.push({
        restaurantId: restId,
        restaurantName: restaurant.name || meta.name || "",
        restaurantCountry: restaurant.country || meta.country || "",
        itemId: newItemId,
        name: item.name || "",
        price: priceNum,
        qty: 1,
      });
    }
    persist(next, restaurant);
    return { ok: true };
  };

  /** Decrement by 1; remove if qty hits 0 */
  const dec = (itemId) => {
    const next = items
      .map((x) => (x.itemId === itemId ? { ...x, qty: x.qty - 1 } : x))
      .filter((x) => x.qty > 0);
    const nextRestaurant = next.length === 0 ? null : restaurant;
    persist(next, nextRestaurant);
  };

  const removeItem = (itemId) => {
    const next = items.filter((x) => x.itemId !== itemId);
    const nextRestaurant = next.length === 0 ? null : restaurant;
    persist(next, nextRestaurant);
  };

  const total = useMemo(
    () => items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((s, it) => s + Number(it.qty || 0), 0),
    [items]
  );

  const value = {
    cart: items,
    restaurant, 
    add,
    dec,
    removeItem,
    clear,
    total,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
