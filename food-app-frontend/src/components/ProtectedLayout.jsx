import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Layout from "./Layout";


export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) navigate("/login", { replace: true, state: { from: location.pathname } });
  }, [token, navigate, location.pathname]);

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
