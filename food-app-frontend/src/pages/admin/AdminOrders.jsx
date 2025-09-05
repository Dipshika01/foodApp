import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const load = async () => {
    setLoading(true);
    const res = await axios.get("http://localhost:5000/api/admin/orders", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setOrders(res.data?.orders || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (orderNo, status) => {
    await axios.patch(`http://localhost:5000/api/admin/orders/${orderNo}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    load();
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">All Orders</h1>
      {orders.map(o => (
        <div key={o.orderNo} className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{o.orderNo}</div>
              <div className="text-xs opacity-70">
                Status: {o.status} • {new Date(o.createdAt).toLocaleString()}
              </div>
              <ul className="mt-2 text-xs opacity-80 list-disc pl-4">
                {o.items.map((it, i) => (
                  <li key={i}>{it.qty} × {it.name || it.itemId}</li>
                ))}
              </ul>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold mb-2">
                ₹{Number(o.total || 0).toFixed(2)}
              </div>
              <div className="flex gap-2">
                {o.status !== "fulfilled" && (
                  <button
                    onClick={() => setStatus(o.orderNo, "fulfilled")}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                  >
                    Mark Fulfilled
                  </button>
                )}
                {o.status === "placed" && (
                  <button
                    onClick={() => setStatus(o.orderNo, "cancelled")}
                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs"
                  >
                    Cancel
                  </button>
                )}
                {o.status === "placed" && (
                  <button
                    onClick={() => setStatus(o.orderNo, "pending")}
                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                  >
                    Move to Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
