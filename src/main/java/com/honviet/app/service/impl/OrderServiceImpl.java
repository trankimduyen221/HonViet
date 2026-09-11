package com.honviet.app.service.impl;

import com.honviet.app.dto.OrderDTO;
import com.honviet.app.dto.OrderDetailDTO;
import com.honviet.app.entity.Food;
import com.honviet.app.entity.Order;
import com.honviet.app.entity.OrderDetail;
import com.honviet.app.entity.User;
import com.honviet.app.repository.FoodRepository;
import com.honviet.app.repository.OrderRepository;
import com.honviet.app.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private FoodRepository foodRepository;

    // Helper method: Chuyển đổi dữ liệu từ Order Entity sang OrderDTO
    private OrderDTO convertToDto(Order order) {
        if (order == null) return null;

        OrderDTO dto = new OrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt() != null ? order.getCreatedAt().toString() : null);
        dto.setShippingAddress(order.getShippingAddress());
        dto.setPhoneNumber(order.getPhoneNumber());
        dto.setReceiverName(order.getReceiverName());
        dto.setPaymentMethod(order.getPaymentMethod());

        // Gán thông tin User khách hàng
        dto.setUser(order.getUser());

        // Bổ sung: Gán thông tin Shipper (nếu có) để Frontend Shipper/Admin hiển thị
        dto.setShipper(order.getShipper());

        // Map danh sách chi tiết đơn hàng (OrderDetail) sang OrderDetailDTO
        if (order.getOrderDetails() != null) {
            List<OrderDetailDTO> detailDTOs = order.getOrderDetails().stream().map(detail -> {
                OrderDetailDTO detailDto = new OrderDetailDTO();
                detailDto.setUniqueId(detail.getUniqueId());
                detailDto.setQuantity(detail.getQuantity());
                detailDto.setPrice(detail.getPrice());

                if (detail.getFood() != null) {
                    detailDto.setFoodId(detail.getFood().getFoodId());
                    detailDto.setFoodName(detail.getFood().getFoodName());
                }
                return detailDto;
            }).collect(Collectors.toList());

            dto.setOrderDetails(detailDTOs);
        } else {
            dto.setOrderDetails(new ArrayList<>());
        }

        return dto;
    }

    // Lấy tất cả đơn hàng
    @Override
    public List<OrderDTO> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // Tìm đơn hàng theo ID
    @Override
    public OrderDTO getOrderById(Integer id) {
        Order order = orderRepository.findById(id).orElse(null);
        return convertToDto(order);
    }

    // ==================== HÀM ĐẶT ĐƠN HÀNG GỘP ====================
    @Override
    public OrderDTO saveOrder(Order order) {
        order.setCreatedAt(LocalDateTime.now());
        order.setStatus("Pending");

        double finalTotalPrice = 0.0;

        if (order.getOrderDetails() != null && !order.getOrderDetails().isEmpty()) {
            for (OrderDetail detail : order.getOrderDetails()) {
                Food food = foodRepository.findById(detail.getFood().getFoodId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn có ID: " + detail.getFood().getFoodId()));

                double itemPrice = food.getPrice() * detail.getQuantity();
                detail.setPrice(itemPrice);
                detail.setFood(food);
                detail.setOrder(order);
                finalTotalPrice += itemPrice;
            }
        }

        order.setTotalPrice(finalTotalPrice);
        Order savedOrder = orderRepository.save(order);
        return convertToDto(savedOrder);
    }

    // ==================== LOGIC THAY ĐỔI TRẠNG THÁI ĐƠN HÀNG ====================

    // 1. ADMIN cập nhật trạng thái đơn hàng
    @Override
    public OrderDTO updateOrderStatus(Integer id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new RuntimeException("Trạng thái cập nhật không được để trống!");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + id));

        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        if ("Canceled".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng này đã bị hủy, không thể thay đổi trạng thái!");
        }

        if ("Success".equalsIgnoreCase(currentStatus) || "Sucess".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng này đã giao thành công và hoàn tất, không thể thay đổi trạng thái!");
        }

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    // 2. ADMIN gán tài xế shipper đi giao hàng
    @Override
    public OrderDTO assignShipper(Integer id, User shipper) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + id));

        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        if ("Canceled".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng này đã bị hủy, không thể gán shipper!");
        }

        if ("Success".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng này đã hoàn thành và giao thành công, không thể gán shipper!");
        }

        order.setShipper(shipper);
        order.setStatus("Delivering");
        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    // 3. USER sửa địa chỉ/sđt nhận hàng
    @Override
    public OrderDTO updateShippingInfo(Integer id, Order newDetails) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + id));

        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        if (!"Pending".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng đã được xử lý hoặc đang giao, không thể sửa thông tin!");
        }

        order.setShippingAddress(newDetails.getShippingAddress());
        order.setPhoneNumber(newDetails.getPhoneNumber());
        order.setReceiverName(newDetails.getReceiverName());

        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    // 4. Hủy đơn hàng
    @Override
    public void cancelOrder(Integer id, String role) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + id));

        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        if ("Success".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng đã giao thành công, không thể hủy đơn!");
        }

        if ("USER".equalsIgnoreCase(role)) {
            if (!"Pending".equalsIgnoreCase(currentStatus)) {
                throw new RuntimeException("Đơn hàng đã được xử lý hoặc đang giao, khách hàng không thể tự hủy!");
            }

            long minutesElapsed = Duration.between(order.getCreatedAt(), LocalDateTime.now()).toMinutes();

            if (minutesElapsed > 10) {
                throw new RuntimeException("Đã quá 10 phút kể từ lúc đặt hàng, bạn không thể hủy đơn này!");
            }
        }

        if ("ADMIN".equalsIgnoreCase(role)) {
            if ("Delivering".equalsIgnoreCase(currentStatus)) {
                throw new RuntimeException("Đơn hàng đang trên đường giao, không thể hủy! Hãy liên hệ Shipper trước.");
            }
        }

        order.setStatus("Canceled");
        orderRepository.save(order);
    }

    // 5. SHIPPER: Cập nhật trạng thái khi đi giao hàng
    @Override
    public OrderDTO shipperUpdateStatus(Integer id, String status) {
        if (status == null || status.trim().isEmpty()) {
            throw new RuntimeException("Trạng thái cập nhật không được để trống!");
        }

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng có ID: " + id));

        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        if (!"Delivering".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng chưa được giao cho bạn hoặc đã hoàn tất, không thể cập nhật!");
        }

        if (!"Success".equalsIgnoreCase(status) && !"Canceled".equalsIgnoreCase(status) && !"Sucess".equalsIgnoreCase(status)) {
            throw new RuntimeException("Shipper chỉ có quyền xác nhận đơn thành công (Success) hoặc hủy đơn (Canceled)!");
        }

        order.setStatus(status);
        Order updatedOrder = orderRepository.save(order);
        return convertToDto(updatedOrder);
    }

    @Override
    public List<OrderDTO> getOrdersByStatus(String status) {
        List<Order> orders = orderRepository.findByStatusOrderByOrderIdDesc(status);
        return orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderDTO> getOrdersByUserId(Integer userId) {
        List<Order> orders = orderRepository.findByUserUserIdOrderByOrderIdDesc(userId);
        return orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // ==================== BỔ SUNG THÊM 2 HÀM MỚI CHO SHIPPER ====================

    // SHIPPER: Lấy danh sách đơn hàng theo danh sách các trạng thái (ví dụ: Pending, Delivering, ...)
    @Override
    public List<OrderDTO> getOrdersByStatuses(List<String> statuses) {
        List<Order> orders = orderRepository.findByStatusInOrderByOrderIdDesc(statuses);
        return orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    // SHIPPER: Lấy danh sách đơn hàng do chính Shipper đó nhận giao
    @Override
    public List<OrderDTO> getOrdersByShipperId(Integer shipperUserId) {
        List<Order> orders = orderRepository.findByShipperUserIdOrderByOrderIdDesc(shipperUserId);
        return orders.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}