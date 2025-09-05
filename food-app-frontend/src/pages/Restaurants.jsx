// src/pages/Restaurants.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

/* Optional (recommended) — add this to your global CSS (e.g., index.css)
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
*/

function useAuth() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const country = localStorage.getItem("country") || "";
  return { token, role, country };
}

/** Stories-style category scroller with desktop arrows + mobile swipe/tap */
/** Stories-style category scroller (no edge fades). 
 *  “All” chip now uses the same gradient ring when selected.
 */
function CategoryStories({ items = [], value, onChange }) {
  const scrollerRef = useRef(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const onResize = () => update();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollByAmount = (dir = 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amt = Math.round(el.clientWidth * 0.9);
    el.scrollBy({ left: dir * amt, behavior: "smooth" });
    setTimeout(update, 350);
  };

  const onTapZone = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    const tapX = e.clientX || (e.touches?.[0]?.clientX ?? mid);
    scrollByAmount(tapX > mid ? +1 : -1);
  };

  // mobile swipe
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let startX = 0;
    let isDown = false;
    const onTouchStart = (e) => { isDown = true; startX = e.touches[0].clientX; };
    const onTouchMove  = (e) => { if (!isDown) return; const dx = startX - e.touches[0].clientX; el.scrollLeft += dx; startX = e.touches[0].clientX; };
    const onTouchEnd   = () => { isDown = false; update(); };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove",  onTouchMove,  { passive: true });
    el.addEventListener("touchend",   onTouchEnd);
    el.addEventListener("scroll",     update,       { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove",  onTouchMove);
      el.removeEventListener("touchend",   onTouchEnd);
      el.removeEventListener("scroll",     update);
    };
  }, []);

  return (
    <div className="relative">
      {/* ⛔️ removed the white edge fades */}

      {/* scroller */}
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-1 pb-2 no-scrollbar"
        style={{ scrollbarWidth: "none" }}
        onScroll={update}
      >
        {/* “All” chip — gradient ring when selected, white inner like others */}
        <button
          type="button"
          onClick={() => onChange?.(value ? "" : "")}
          className="flex flex-col items-center min-w-[64px] select-none"
          title="All"
        >
          <div
            className={`w-16 h-16 rounded-full p-[2px] ${
              !value
                ? "bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-500"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-800 grid place-items-center">
              <span className={`text-sm font-semibold ${!value ? "" : "opacity-80"}`}>All</span>
            </div>
          </div>
          <span className="text-[11px] mt-1 whitespace-nowrap">All</span>
        </button>

        {items.map((c) => {
          const selected = value && value === c.name;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onChange?.(selected ? "" : c.name)}
              className="flex flex-col items-center min-w-[64px] select-none"
              title={c.name}
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] ${
                  selected
                    ? "bg-gradient-to-tr from-indigo-500 via-pink-500 to-amber-500"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-800 grid place-items-center">
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className={`text-sm font-semibold ${selected ? "" : "opacity-80"}`}>
                      {c.name[0]}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] mt-1 whitespace-nowrap">{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* desktop arrows */}
      {canL && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 shadow ring-1 ring-black/5 dark:ring-white/10 items-center justify-center hover:scale-105 transition"
          aria-label="Scroll left"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      {canR && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 shadow ring-1 ring-black/5 dark:ring-white/10 items-center justify-center hover:scale-105 transition"
          aria-label="Scroll right"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* mobile tap zones (IG-style) */}
      <div className="md:hidden absolute inset-y-0 left-0 w-1/2 z-10" onClick={onTapZone} />
      <div className="md:hidden absolute inset-y-0 right-0 w-1/2 z-10" onClick={onTapZone} />
    </div>
  );
}

const role = (localStorage.getItem("role") || "").toUpperCase();
const canManageMenu = ["ADMIN", "MANAGER", "MEMBER"].includes(role);
export default function Restaurants() {
  const navigate = useNavigate();
  const { token, country } = useAuth();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState("");
  const [category, setCategory] = useState(""); // selected category

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    (async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/restaurants", {
          headers: { Authorization: `Bearer ${token}`, "x-user-country": country },
        });
        setRestaurants(res.data?.restaurants || []);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.error || err.message || "Failed to load restaurants";
        setError(`Failed to load restaurants (${status || "no-status"}): ${msg}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, country, navigate]);
  const categoryImageMap = useMemo(
    () => ({}),
    []
  );

  const categories = useMemo(() => {
    const set = new Set();
    (restaurants || []).forEach((r) => (r.categories || []).forEach((c) => set.add(c)));
    return Array.from(set).map((name) => ({
      name,
      image: categoryImageMap[name] || null,
    }));
  }, [restaurants, categoryImageMap]);

  const filtered = useMemo(() => {
    if (!category) return restaurants;
    return (restaurants || []).filter((r) => (r.categories || []).includes(category));
  }, [restaurants, category]);

  if (loading) {
    return <div className="min-h-[60vh] grid place-items-center">Loading…</div>;
  }

  if (error) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-red-200 bg-red-600/20 border border-red-500 rounded-xl p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Restaurants</h1>
          <p className="text-xs opacity-70">
            {filtered.length} of {restaurants.length}{restaurants.length === 1 ? " result" : " results"}
            {category ? ` • ${category}` : ""}
          </p>
        </div>
        <Link
          to="/cart"
          className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
        >
          Go to Cart
        </Link>
      </div>

      {/* Category stories row */}
      {categories.length > 0 && (
        <CategoryStories
          items={categories}
          value={category}
          onChange={setCategory}
        />
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10">
          No restaurants {category ? `in “${category}”` : ""}.
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((r) => {
          const id = r.id || r._id;

          return (
            <div
              key={id}
              className="rounded-2xl overflow-hidden
                         bg-gradient-to-b from-[#4a8ed3] via-[#7e5dbf] to-[#adadcc]
                         dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]
                         dark:text-white border border-black/5 dark:border-white/10
                         flex flex-col hover:shadow-lg transition"
            >
              <div
                className="w-full h-48 sm:h-56 cursor-pointer"
                onClick={() => navigate(`/restaurants/${id}`)}
                title={`Open ${r.name}`}
              >
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

              {/* Body */}
              <div className="p-5">
                <h2
                  className="text-lg font-semibold cursor-pointer hover:underline"
                  onClick={() => navigate(`/restaurants/${id}`)}
                >
                  {r.name}
                </h2>
                <p className="text-xs text-black/80 dark:text-white/70 mb-4">
                  {r.cuisine || "—"} • {r.city || "—"} {r.country ? `• ${r.country}` : ""}
                </p>
                {Array.isArray(r.categories) && r.categories.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.categories.slice(0, 3).map((cat) => (
                      <span key={cat} className="px-2 py-1 text-[10px] rounded-full bg-white/20 text-white/90">
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                  {canManageMenu && (
                  <Link
                    to={`/admin/restaurants/${id}/menu`}
                    className="inline-block mt-3 px-2 py-1 rounded bg-[#3c6495] hover:bg-[#0651ac] text-white text-sm
                               dark:bg-[#ba3f3f] dark:hover:bg-[#e31a1a]"
                    title="Add / edit menu"
                  >
                    Manage Menu
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
