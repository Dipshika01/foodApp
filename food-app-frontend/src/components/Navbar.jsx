// src/components/Navbar.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { itemCount } = useCart();

  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef(null);

  // Roles are stored UPPERCASE in DB/JWT
  const rawRole = (localStorage.getItem("role") || "").toUpperCase();
  const isAdmin = rawRole === "ADMIN";
  const isManager = rawRole === "MANAGER";
  const isMember = rawRole === "MEMBER";
  const canCheckout = isAdmin || isManager;
  const disabledLinkCls =
    "opacity-50 cursor-not-allowed select-none pointer-events-none";

  useEffect(() => {
    // derive user name
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedFirstName = localStorage.getItem("firstName");
    const fallbackName = localStorage.getItem("name");
    if (storedUser?.firstName) setUserName(storedUser.firstName);
    else if (storedFirstName) setUserName(storedFirstName);
    else if (fallbackName) setUserName(fallbackName);

    // dark mode init
    const storedTheme = localStorage.getItem("darkMode");
    if (storedTheme === "true") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }

    // outside click closes dropdown
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    document.documentElement.classList.toggle("dark", newMode);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("firstName");
    localStorage.removeItem("name");
    window.location.href = "/login";
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full shadow-lg px-4 sm:px-6 py-3 backdrop-blur-md transition-colors duration-300
      ${
        isDarkMode
          ? "bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white border-b border-gray-700"
          : "bg-gradient-to-b from-[#3b89bf] to-[#04356d] text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Logo + Brand*/}
        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline font-semibold tracking-wide cursor-pointer"
            onClick={() => navigate("/restaurants")}
          >
            FoodApp
          </span>
          <span className="md:hidden font-medium text-sm">
            Hi {userName || "User"}
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5">
          <Link className="hover:underline" to="/restaurants">
            Restaurants
          </Link>

          <Link className="hover:underline" to="/orders">
            My Orders
          </Link>

          {/* Cart link + badge */}
          <Link className="relative hover:underline" to="/cart">
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Checkout (RBAC: ADMIN & MANAGER only, only if cart has items) */}
          {itemCount > 0 ? (
            canCheckout ? (
              <Link className="hover:underline" to="/checkout">
                Checkout
              </Link>
            ) : (
              <span
                className={`px-2 py-0.5 rounded ${disabledLinkCls}`}
                title="Members can't checkout"
              >
                Checkout
              </span>
            )
          ) : null}

          {/* Admin link (desktop) */}
          {isAdmin && (
            <Link className="hover:underline" to="/admin/restaurants">
              Admin
            </Link>
          )}

          {/* Search */}
          {/* <input
            type="text"
            placeholder="Search..."
            className={`px-3 py-1 rounded-md focus:outline-none focus:ring w-52
              ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-600 focus:ring-[#c40505]"
                  : "bg-white text-black focus:ring-[#c40505]"
              }`}
          /> */}
        </div>

        {/* Right: theme + user */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="text-xl focus:outline-none hover:scale-110 transition"
            title="Toggle theme"
          >
            {isDarkMode ? (
              <i className="fas fa-sun text-[#6785a9]"></i>
            ) : (
              <i className="fas fa-moon"></i>
            )}
          </button>

          {/* Hi User + Role (desktop) */}
          <span className="hidden md:flex items-center gap-2 text-base font-medium">
            <span>Hi {userName || "User"}</span>
            {rawRole && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 border border-white/20">
                {rawRole}
              </span>
            )}
          </span>

          {/* User Dropdown */}
          <button
            className="focus:outline-none hover:scale-110 transition"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
          >
            <i className="fas fa-user-circle text-3xl"></i>
          </button>

          {dropdownOpen && (
            <div
              className={`absolute right-0 top-12 rounded shadow-md w-44 z-50
                ${
                  isDarkMode
                    ? "bg-gray-900 text-white border border-gray-700"
                    : "bg-white text-black"
                }`}
              role="menu"
            >
              <ul className="text-sm">
                <li className="px-4 py-2 opacity-80 select-none">
                  Hi {userName || "User"}
                </li>

                {isAdmin && (
                  <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <Link
                      to="/admin/restaurants"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Admin
                    </Link>
                  </li>
                )}

                <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Link to="/orders" onClick={() => setDropdownOpen(false)}>
                    My Orders
                  </Link>
                </li>

                <li className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                  <Link to="/cart" onClick={() => setDropdownOpen(false)}>
                    Cart
                  </Link>
                </li>

                {/* Checkout in dropdown (RBAC) */}
                {itemCount > 0 && (
                  <li
                    className={`px-4 py-2 ${
                      canCheckout
                        ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        : disabledLinkCls
                    }`}
                  >
                    {canCheckout ? (
                      <Link
                        to="/checkout"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Checkout
                      </Link>
                    ) : (
                      <span title="Members can't checkout">Checkout</span>
                    )}
                  </li>
                )}

                <li
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={logout}
                >
                  Logout
                </li>
              </ul>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden ml-1 text-2xl focus:outline-none"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-[max-height] duration-300 overflow-hidden ${
          mobileOpen ? "max-h-96 mt-3" : "max-h-0"
        }`}
      >
        <div className="flex flex-col gap-2 pb-3">
          <Link
            className="py-2 hover:underline"
            to="/restaurants"
            onClick={() => setMobileOpen(false)}
          >
            Restaurants
          </Link>

          <Link
            className="py-2 hover:underline"
            to="/orders"
            onClick={() => setMobileOpen(false)}
          >
            My Orders
          </Link>

          {/* Cart with badge */}
          <Link
            className="py-2 hover:underline relative w-max"
            to="/cart"
            onClick={() => setMobileOpen(false)}
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Checkout (mobile, RBAC) */}
          {itemCount > 0 &&
            (canCheckout ? (
              <Link
                className="py-2 hover:underline"
                to="/checkout"
                onClick={() => setMobileOpen(false)}
              >
                Checkout
              </Link>
            ) : (
              <span className={`py-2 ${disabledLinkCls}`} title="Members can't checkout">
                Checkout
              </span>
            ))}

          {/* Admin (mobile) */}
          {isAdmin && (
            <Link
              className="py-2 hover:underline"
              to="/admin/restaurants"
              onClick={() => setMobileOpen(false)}
            >
              Admin
            </Link>
          )}

          {/* Mobile search */}
          <input
            type="text"
            placeholder="Search..."
            className={`mt-1 px-3 py-2 rounded-md focus:outline-none focus:ring w-full
              ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-600 focus:ring-[#c40505]"
                  : "bg-white text-black focus:ring-[#c40505]"
              }`}
          />
        </div>
      </div>
    </nav>
  );
}
