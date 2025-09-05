import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function AdminRestaurants() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    city: "",
    country: "India",
    coverImage: "",
    categories: "", // comma separated
  });

  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const navigate = useNavigate();

  // API base (http://localhost:5000 by default) + /api
  const API = useMemo(
    () => (import.meta.env.VITE_API_BASE || "http://localhost:5000") + "/api",
    []
  );
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token]
  );

  useEffect(() => {
    if (role !== "admin") {
      navigate("/restaurants");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/restaurants`, auth);
        setList(res.data?.restaurants || []);
        setErr("");
      } catch (e) {
        setErr(e.response?.data?.error || "Failed to load restaurants");
      } finally {
        setLoading(false);
      }
    })();
  }, [API, auth, role, navigate]);

  const create = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const payload = {
        ...form,
        categories: String(form.categories || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await axios.post(`${API}/restaurants`, payload, auth);
      setList((prev) => [res.data.restaurant, ...prev]);
      setForm({
        name: "",
        cuisine: "",
        city: "",
        country: "India",
        coverImage: "",
        categories: "",
      });
    } catch (e) {
      setErr(e.response?.data?.error || "Create failed");
    }
  };

  const [deletingId, setDeletingId] = useState("");

  const removeRestaurant = async (id, name) => {
    if (!id) return;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      setDeletingId(id);
      await axios.delete(`${API}/restaurants/${encodeURIComponent(id)}`, auth);
      setList((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } catch (e) {
      alert(e.response?.data?.error || "Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Admin • Restaurants</h1>

      {/* Create restaurant */}
      <form
        onSubmit={create}
        className="grid sm:grid-cols-2 gap-4 p-6 rounded-xl backdrop-blur-md border border-white/20 shadow text-white"
      >
        {err && (
          <p className="col-span-2 text-rose-200 text-sm bg-rose-900/40 px-3 py-2 rounded">
            {err}
          </p>
        )}

        <input
          className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <input
          className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="Cuisine"
          value={form.cuisine}
          onChange={(e) => setForm((f) => ({ ...f, cuisine: e.target.value }))}
        />

        <input
          className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
        />

        <select
          className="p-3 rounded bg-white/15 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={form.country}
          onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
        >
          <option className="text-black">India</option>
          <option className="text-black">America</option>
        </select>

        <input
          className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:col-span-2"
          placeholder="Cover Image URL (optional)"
          value={form.coverImage}
          onChange={(e) =>
            setForm((f) => ({ ...f, coverImage: e.target.value }))
          }
        />

        <input
          className="p-3 rounded bg-white/15 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:col-span-2"
          placeholder="Categories (comma separated, e.g. Indian, Veg, Fast Food)"
          value={form.categories}
          onChange={(e) =>
            setForm((f) => ({ ...f, categories: e.target.value }))
          }
        />

        {/* bottom row: button LEFT, spacer on the right */}
        <div className="sm:col-span-1">
          <button
            type="submit"
            className="px-4 py-3 rounded bg-[#3c6495] hover:bg-[#0651ac] text-white text-sm dark:bg-[#ba3f3f] dark:hover:bg-[#e31a1a] shadow transition"
          >
            Create Restaurant
          </button>
        </div>
        <div className="hidden sm:block sm:col-span-1" />
      </form>

      {/* Grid of restaurants */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((r) => {
          const id = r._id || r.id;
          return (
            <div
              key={id}
              className="rounded-xl overflow-hidden
                         bg-gradient-to-b from-[#979797] via-[#7e5dbf] to-[#adadcc]
                         dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]
                         dark:text-white border border-black/5 dark:border-white/10
                         flex flex-col"
            >
              <div className="w-full h-48 sm:h-56">
                {r.coverImage ? (
                  <img
                    src={r.coverImage}
                    alt={r.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 dark:bg-white/5" />
                )}
              </div>

              <div className="p-4 flex flex-col gap-1">
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs opacity-80">
                  {(r.cuisine || "—")} • {(r.city || "—")} • {r.country}
                </p>

                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/admin/restaurants/${id}/menu`}
                    className="px-3 py-2 rounded-lg bg-[#3c6495] hover:bg-[#0651ac] text-white text-sm dark:bg-[#ba3f3f] dark:hover:bg-[#e31a1a]"
                  >
                    Manage Menu
                  </Link>
{/* bg-[#3c6495] hover:bg-[#0651ac] text-white text-sm dark:bg-[#ba3f3f] dark:hover:bg-[#e31a1a] */}
                  <button
                    onClick={() => removeRestaurant(id, r.name)}
                    disabled={deletingId === id}
                    className={`px-3 py-2 rounded-lg text-white text-sm ${
                      deletingId === id
                        ? "bg-[#e8c9c9] cursor-not-allowed" 
                        : "bg-rose-600 hover:bg-rose-500"
                    }`}
                    title="Delete restaurant"
                  >
                    {deletingId === id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}