package com.honviet.app.service;

import com.honviet.app.dto.OrderDTO;
import com.honviet.app.entity.Order;
import com.honviet.app.entity.User;

import java.util.List;

public interface OrderService {
    // Lấy hết đơn hàng dưới dạng DTO
    List<OrderDTO> getAllOrders();

    // Tìm đơn hàng theo ID
    OrderDTO getOrderById(Integer id);

    // Lưu, cập nhật đơn hàng gộp
    OrderDTO saveOrder(Order order);

    // ADMIN cập nhật trạng thái đơn hàng
    OrderDTO updateOrderStatus(Integer id, String status);

    // ADMIN gán tài xế shipper đi giao hàng
    OrderDTO assignShipper(Integer id, User shipper);

    // USER sửa địa chỉ/sđt nhận hàng
    OrderDTO updateShippingInfo(Integer id, Order order);

    // Hủy đơn hàng
    void cancelOrder(Integer id, String role);

    // SHIPPER cập nhật trạng thái khi đi giao hàng
    OrderDTO shipperUpdateStatus(Integer id, String status);

    // Lấy đơn hàng theo 1 trạng thái
    List<OrderDTO> getOrdersByStatus(String status);

    // USER: Lấy lịch sử đơn hàng của chính mình (Giữ nguyên)
    List<OrderDTO> getOrdersByUserId(Integer userId);

    // ================= BỔ SUNG CHO SHIPPER =================

    // SHIPPER: Lấy danh sách các đơn hàng theo NHIỀU trạng thái (Ví dụ: Pending, Preparing, Confirmed)
    List<OrderDTO> getOrdersByStatuses(List<String> statuses);

    // SHIPPER: Lấy danh sách các đơn hàng do chính Shipper đó nhận giao
    List<OrderDTO> getOrdersByShipperId(Integer shipperUserId);
}