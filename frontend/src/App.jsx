/* eslint-disable */
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// --- PHÂN HỆ ADMIN ---
import CategoryManager from "./views/admin/CategoryManager";
import FoodManager from "./views/admin/FoodManager";
import OrdersTable from "./views/admin/OrdersTable";
import UserManager from "./views/admin/UserManager";

// --- PHÂN HỆ CLIENT ---
import Home from "./views/client/Home"; // 🌟 Import Trang Chủ mới tạo
import FoodMenu from "./views/client/FoodMenu";
import CartPage from "./views/client/CartPage";
import LoginRegister from "./views/client/LoginRegister";
import UserProfile from "./views/client/UserProfile";
import ShipperOrders from "./views/client/ShipperOrders";
// 🌟 1. THÊM DÒNG IMPORT NÀY:
import CustomerHistory from "./views/client/CustomerHistory";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route Admin */}
                <Route path="/admin/categories" element={<CategoryManager />} />
                <Route path="/admin/foods" element={<FoodManager />} />
                <Route path="/admin/orders" element={<OrdersTable />} />
                <Route path="/admin/users" element={<UserManager />} />

                {/* Route Client */}
                {/* 🌟 Trang chủ mặc định khi vừa truy cập website */}
                <Route path="/" element={<Home />} />

                {/* 🌟 Trang Thực Đơn riêng biệt tách biệt khỏi trang chủ */}
                <Route path="/client/menu" element={<FoodMenu />} />

                <Route path="/client/cart" element={<CartPage />} />
                <Route path="/client/auth" element={<LoginRegister />} />
                <Route path="/client/profile" element={<UserProfile />} />

                {/* 🌟 2. THÊM DÒNG ROUTE NÀY ĐỂ KHI TRUY CẬP /client/history SẼ RA TRANG LỊCH SỬ: */}
                <Route path="/client/history" element={<CustomerHistory />} />

                <Route path="/shipper/orders" element={<ShipperOrders />} />

                {/* Điều hướng mặc định nếu gõ sai URL: Trả về Trang Chủ */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;