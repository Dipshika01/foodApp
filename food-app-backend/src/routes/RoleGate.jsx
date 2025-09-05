import { Navigate, Outlet } from "react-router-dom";

export default function RoleGate({ allow = [] }) {
  const token = localStorage.getItem("token");
  const role  = String(localStorage.getItem("role") || "").toUpperCase();

  // must be logged in
  if (!token) return <Navigate to="/login" replace />;
  if (allow.length && !allow.includes(role)) {
    return <Navigate to="/restaurants" replace />;
  }

  return <Outlet />;
}
