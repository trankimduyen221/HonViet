package com.honviet.app.repository;

import com.honviet.app.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    // 1. Dùng cho USER: Lấy lịch sử đơn hàng của User
    List<Order> findByUserUserIdOrderByOrderIdDesc(Integer userId);

    // 2. Dùng cho SHIPPER: Lấy đơn theo 1 trạng thái cụ thể
    List<Order> findByStatus(String status);
    List<Order> findByStatusOrderByOrderIdDesc(String status);

    // 3. Dùng cho SHIPPER: Lấy đơn theo danh sách nhiều trạng thái (Ví dụ: Pending, Preparing)
    List<Order> findByStatusInOrderByOrderIdDesc(List<String> statuses);

    // 4. Dùng cho SHIPPER: Lấy danh sách các đơn do chính Shipper đó đảm nhận
    List<Order> findByShipperUserIdOrderByOrderIdDesc(Integer shipperUserId);
}