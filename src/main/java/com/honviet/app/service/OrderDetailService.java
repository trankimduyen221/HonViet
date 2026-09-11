package com.honviet.app.service;

import com.honviet.app.dto.OrderDetailDTO;
import com.honviet.app.entity.OrderDetail;

import java.util.List;

public interface OrderDetailService {
    // Lấy danh sách dưới dạng DTO
    List<OrderDetailDTO> getAllOrderDetails();

    // Tìm theo ID trả về DTO
    OrderDetailDTO getOrderDetailById(Integer id);

    // Thêm món lẻ (Nhận Entity đầu vào, trả về DTO)
    OrderDetailDTO createOrderDetail(OrderDetail orderDetail);

    // Cập nhật món lẻ (Nhận Entity thông tin mới, trả về DTO)
    OrderDetailDTO updateOrderDetail(Integer id, OrderDetail newDetails);

    // Xóa món lẻ
    void deleteOrderDetail(Integer id);
}