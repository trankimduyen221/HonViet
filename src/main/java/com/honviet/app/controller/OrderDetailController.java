package com.honviet.app.controller;

import com.honviet.app.dto.OrderDetailDTO;
import com.honviet.app.entity.OrderDetail;
import com.honviet.app.service.OrderDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orderdetails")
public class OrderDetailController {

    @Autowired
    private OrderDetailService orderDetailService;

    // 1. LẤY HẾT CHI TIẾT ĐƠN HÀNG - CHỈ ADMIN ĐƯỢC PHÉP
    // Đường link tương ứng: GET http://localhost:8080/api/orderdetails
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<OrderDetailDTO> getAllOrderDetails() {
        return orderDetailService.getAllOrderDetails();
    }

    // 2. TÌM CHI TIẾT ĐƠN HÀNG THEO ID - Cho phép mọi user đã đăng nhập xem chi tiết món của mình
    // Đường link tương ứng: GET http://localhost:8080/api/orderdetails/1
    @GetMapping("/{id}")
    public OrderDetailDTO getOrderDetailById(@PathVariable Integer id) {
        return orderDetailService.getOrderDetailById(id);
    }

    // 3. THÊM MỚI MÓN ĂN VÀO ĐƠN HÀNG - Mở quyền cho người dùng đã đăng nhập
    // Đường link tương ứng: POST http://localhost:8080/api/orderdetails
    @PostMapping
    public String createOrderDetail(@RequestBody OrderDetail orderDetail) {
        try {
            // Service hiện tại nhận vào OrderDetail entity và xử lý lưu xuống DB
            orderDetailService.createOrderDetail(orderDetail);
            return "Thêm món ăn vào đơn hàng thành công! Tổng tiền đơn hàng đã được cập nhật tự động.";
        } catch (RuntimeException e) {
            return "Lỗi thêm món: " + e.getMessage();
        }
    }

    // 4. CẬP NHẬT SỐ LƯỢNG MÓN ĂN - Mở quyền cho người dùng đã đăng nhập để chỉnh sửa giỏ hàng
    // Đường link tương ứng: PUT http://localhost:8080/api/orderdetails/1
    @PutMapping("/{id}")
    public String updateOrderDetail(@PathVariable Integer id, @RequestBody OrderDetail orderDetail) {
        try {
            orderDetailService.updateOrderDetail(id, orderDetail);
            return "Cập nhật chi tiết đơn hàng số " + id + " thành công!";
        } catch (RuntimeException e) {
            return "Lỗi cập nhật món: " + e.getMessage();
        }
    }
}