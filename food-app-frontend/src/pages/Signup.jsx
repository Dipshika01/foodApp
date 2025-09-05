import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",     // keep users as members by default
    country: "India",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!PASSWORD_RULE.test(form.password)) {
      setErr("Password needs upper, lower, number, special, and 8+ chars.");
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post("/api/auth/signup", form);
      if (data?.id || data?.email) {
        setOk("Account created. You can log in now.");
        setTimeout(() => nav("/login"), 800);
      } else {
        setErr("Signup failed");
      }
    } catch (e2) {
      setErr(e2.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
      <form
        onSubmit={submit}
        className="bg-gray-900/90 p-8 rounded-2xl shadow-md w-full max-w-md backdrop-blur"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Create account</h2>

        {err && <p className="text-red-300 mb-4 text-sm text-center">{err}</p>}
        {ok && <p className="text-green-300 mb-4 text-sm text-center">{ok}</p>}

        <input
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={onChange}
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-500"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email (e.g. thor@slooze.xyz)"
          value={form.email}
          onChange={onChange}
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-500"
          required
          autoComplete="username"
        />

        <div className="relative mb-2">
          <input
            type={showPwd ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            className="w-full p-3 pr-10 rounded bg-gray-800 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-500"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                   strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.03-10-9s4.477-9 10-9c1.083 0 2.124.181 3.125.525m2.625 2.375a9.975 9.975 0 012.25 6.1c0 1.243-.232 2.432-.65 3.525M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                   strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3.98 8.223a10.008 10.008 0 0116.664 0M21 12c0 2.21-.895 4.209-2.34 5.657m-3.054 2.178a9.99 9.99 0 01-4.615 1.165c-5.523 0-10-4.03-10-9s4.477-9 10-9c1.315 0 2.578.254 3.743.719"/>
              </svg>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-300 mb-4">
          must include upper, lower, number, special and be at least 8 chars.
        </p>

        {/* if you want users to choose role/country, un-comment this block
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select
            name="role"
            value={form.role}
            onChange={onChange}
            className="p-3 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="MEMBER">Member</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            name="country"
            value={form.country}
            onChange={onChange}
            className="p-3 rounded bg-gray-800 text-white outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="India">India</option>
            <option value="America">America</option>
          </select>
        </div>
        */}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 rounded transition ${
            loading ? "bg-pink-400 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-500"
          }`}
        >
          {loading ? "Creating..." : "Sign up"}
        </button>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="underline hover:text-pink-300">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
