import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "./components/ProtectedLayout";
import RequireRole from "./components/RequireRole";

import Login from "./pages/Login";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import AdminRestaurants from "./pages/admin/AdminRestaurants";
import AdminMenu from "./pages/admin/AdminMenu";

import CartProvider from "./context/CartContext";

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/restaurants" replace />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurants/:id" element={<RestaurantDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />

          {/* Add restaurants → ADMIN only */}
          <Route
            path="/admin/restaurants"
            element={
              <RequireRole roles={["Admin"]}>
                <AdminRestaurants />
              </RequireRole>
            }
          />

          {/* Manage menu → ALL roles */}
          <Route
            path="/admin/restaurants/:id/menu"
            element={
              <RequireRole roles={["Admin", "Manager", "Member"]}>
                <AdminMenu />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/restaurants" replace />} />
      </Routes>
    </CartProvider>
  );
}
