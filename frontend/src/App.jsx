/* eslint-disable */
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// --- PHÂN HỆ ADMIN ---
import CategoryManager from "./views/admin/CategoryManager";
import FoodManager from "./views/admin/FoodManager";
import OrdersTable from "./views/admin/OrdersTable";
import UserManager from "./views/admin/UserManager";

// --- PHÂN HỆ CLIENT ---
import Home from "./views/client/Home";
import FoodMenu from "./views/client/FoodMenu";
import CartPage from "./views/client/CartPage";
import LoginRegister from "./views/client/LoginRegister";
import UserProfile from "./views/client/UserProfile";
import ShipperOrders from "./views/client/ShipperOrders";
import CustomerHistory from "./views/client/CustomerHistory";

// Component hỗ trợ tự động cuộn lên đầu trang khi đổi Route
function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Routes>
                {/* --- ROUTE PHÂN HỆ ADMIN --- */}
                <Route path="/admin/categories" element={<CategoryManager />} />
                <Route path="/admin/foods" element={<FoodManager />} />
                <Route path="/admin/orders" element={<OrdersTable />} />
                <Route path="/admin/users" element={<UserManager />} />

                {/* --- ROUTE PHÂN HỆ CLIENT --- */}
                <Route path="/" element={<Home />} />
                <Route path="/client/menu" element={<FoodMenu />} />
                <Route path="/client/cart" element={<CartPage />} />
                <Route path="/client/auth" element={<LoginRegister />} />
                <Route path="/client/profile" element={<UserProfile />} />
                <Route path="/client/history" element={<CustomerHistory />} />

                {/* --- ROUTE PHÂN HỆ SHIPPER --- */}
                <Route path="/shipper/orders" element={<ShipperOrders />} />

                {/* --- CẤU HÌNH ĐIỀU HƯỚNG MẶC ĐỊNH KHÍ GÕ SAI URL --- */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;