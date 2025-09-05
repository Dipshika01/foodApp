import { Navigate } from "react-router-dom";

export default function RequireRole({ roles, children }) {
  const r = (localStorage.getItem("role") || "").toLowerCase();
  return roles.map(x => x.toLowerCase()).includes(r)
    ? children
    : <Navigate to="/restaurants" />;
}
