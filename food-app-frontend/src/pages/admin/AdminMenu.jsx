import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { formatMoney } from "../../utils/money";

export default function AdminMenu() {
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const API_PREFIX = "/api"; 

  const api = useMemo(() => {
    const client = axios.create({ baseURL: API_BASE });
    client.interceptors.request.use((cfg) => {
      cfg.headers = cfg.headers || {};
      if (token) cfg.headers.Authorization = `Bearer ${token}`;
      return cfg;
    });
    return client;
  }, [API_BASE, token]);

  const [restaurant, setRestaurant] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  // use a stable id for edit/delete (backend expects :itemId)
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_PREFIX}/restaurants/${id}`);
      setRestaurant(res.data?.restaurant || null);
      setErr("");
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${API_PREFIX}/restaurants/${id}/menu`, {
        ...form,
        price: Number(form.price),
      });
      setForm({ name: "", description: "", price: "", image: "" });
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Add item failed");
    }
  };

  const startEdit = (m) => {
    // prefer backend-provided id; fall back to name if your old data missed ids
    const stableId = m.id || m.name;          // ✅ define it
    setEditId(stableId);                      // ✅ set once
    setEditForm({
      name: m.name,
      description: m.description || "",
      price: m.price ?? "",
      image: m.image || "",
    });
  };

  const saveEdit = async () => {
    try {
      await api.put(
        `${API_PREFIX}/restaurants/${id}/menu/${encodeURIComponent(editId)}`,
        { ...editForm, price: Number(editForm.price) } // ✅ consistent client
      );
      setEditId(null);
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Update item failed");
    }
  };

  const remove = async (itemId) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(
        `${API_PREFIX}/restaurants/${id}/menu/${encodeURIComponent(itemId)}`
      ); // ✅ consistent client
      load();
    } catch (e) {
      alert(e.response?.data?.error || "Delete item failed");
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center">Loading…</div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide text-slate-900 dark:text-white drop-shadow-sm">
              Manage Menu
            </h1>
            {restaurant && (
              <p className="text-slate-700 dark:text-white/85 font-medium">
                {restaurant.name}
              </p>
            )}
          </div>
          <Link
            to="/admin/restaurants"
            className="px-3 py-2 rounded-lg bg-[#3c6495] hover:bg-[#0651ac] text-white"
          >
            Back
          </Link>
        </div>

        {/* Add item form – glassy card, light/dark friendly */}
        <form
          onSubmit={addItem}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 rounded-xl 
                     bg-white/10 dark:bg-white/10 backdrop-blur-md 
                     border border-white/20 shadow text-slate-900 dark:text-white"
        >
          {err && (
            <p className="sm:col-span-2 lg:col-span-3 text-rose-200 text-sm bg-rose-900/40 px-3 py-2 rounded">
              {err}
            </p>
          )}

          <input
            className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <input
            className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />

          <input
            className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300
                       sm:col-span-2 lg:col-span-1"
            placeholder="Image URL"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
          />

          <input
            className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300
                       sm:col-span-2 lg:col-span-2"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />

          {/* Live preview – fixed height to match cards */}
          {form.image && (
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="w-full h-48 sm:h-56 rounded overflow-hidden border border-white/20">
                <img
                  src={form.image}
                  alt="preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* Left-aligned action button (like AdminRestaurants) */}
          <div className="sm:col-span-1">
            <button
              className="px-4 py-3 rounded bg-[#3c6495] hover:bg-[#0651ac] text-white font-medium shadow transition"
              type="submit"
            >
              Add Item
            </button>
          </div>
          <div className="hidden sm:block sm:col-span-1 lg:col-span-2" />
        </form>

        {/* Items grid – same image behavior as other pages */}
        <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {!restaurant || (restaurant.menu || []).length === 0 ? (
            <div className="col-span-full text-center text-slate-800/80 dark:text-white/80">
              No items yet.
            </div>
          ) : (
            (restaurant.menu || []).map((m) => {
              const stableId = m.id || m.name; // fallback for legacy items
              const isEditing = editId === stableId;

              return (
                <div
                  key={stableId}
                  className="rounded-2xl overflow-hidden
                             bg-white/10 dark:bg-white/10 backdrop-blur-md
                             border border-white/20 shadow text-slate-900 dark:text-white p-0"
                >
                  {isEditing ? (
                    <div className="p-4">
                      <input
                        className="mb-2 w-full p-3 rounded bg-white/70 dark:bg-white/15 text-slate-900 dark:text-white
                                   placeholder-slate-500 dark:placeholder-white/70 border-0 focus:ring-2 focus:ring-indigo-300"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((s) => ({ ...s, name: e.target.value }))
                        }
                      />

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="number"
                          step="0.01"
                          className="p-3 rounded bg-white/70 dark:bg-white/15 text-slate-900 dark:text-white
                                     placeholder-slate-500 dark:placeholder-white/70 border-0 focus:ring-2 focus:ring-indigo-300"
                          value={editForm.price}
                          onChange={(e) =>
                            setEditForm((s) => ({
                              ...s,
                              price: e.target.value,
                            }))
                          }
                        />
                        <input
                          className="p-3 rounded bg-white/70 dark:bg-white/15 text-slate-900 dark:text-white
                                     placeholder-slate-500 dark:placeholder-white/70 border-0 focus:ring-2 focus:ring-indigo-300"
                          value={editForm.image}
                          onChange={(e) =>
                            setEditForm((s) => ({
                              ...s,
                              image: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <input
                        className="mb-2 w-full p-3 rounded bg-white/70 dark:bg-white/15 text-slate-900 dark:text-white
                                   placeholder-slate-500 dark:placeholder-white/70 border-0 focus:ring-2 focus:ring-indigo-300"
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((s) => ({
                            ...s,
                            description: e.target.value,
                          }))
                        }
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-2 rounded bg-[#3c6495] hover:bg-[#0651ac] text-white text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Uniform image area */}
                      <div className="w-full h-48 sm:h-56">
                        {m.image ? (
                          <img
                            src={m.image}
                            alt={m.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/10 dark:bg-white/5" />
                        )}
                      </div>

                      <div className="p-4">
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-xs text-slate-700/80 dark:text-white/80">
                          {formatMoney(m.price)}
                        </p>
                        {m.description && (
                          <p className="text-xs text-slate-700/80 dark:text-white/80 mt-1">
                            {m.description}
                          </p>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => startEdit(m)}
                            className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => remove(stableId)}
                            className="px-3 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
