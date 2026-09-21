package com.honviet.app.service.impl;

import com.honviet.app.dto.OrderDetailDTO;
import com.honviet.app.entity.Food;
import com.honviet.app.entity.Order;
import com.honviet.app.entity.OrderDetail;
import com.honviet.app.repository.FoodRepository;
import com.honviet.app.repository.OrderRepository;
import com.honviet.app.repository.OrderDetailRepository;
import com.honviet.app.service.OrderDetailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderDetailServiceImpl implements OrderDetailService {

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private FoodRepository foodRepository;

    // Helper method: Chuyển đổi từ Entity sang DTO để trả về Client sạch sẽ, không bị lặp vòng
    private OrderDetailDTO convertToDto(OrderDetail orderDetail) {
        if (orderDetail == null) return null;

        OrderDetailDTO dto = new OrderDetailDTO();
        dto.setUniqueId(orderDetail.getUniqueId());
        dto.setQuantity(orderDetail.getQuantity());
        dto.setPrice(orderDetail.getPrice());

        if (orderDetail.getFood() != null) {
            dto.setFoodId(orderDetail.getFood().getFoodId());
            dto.setFoodName(orderDetail.getFood().getFoodName());
        }
        return dto;
    }

    @Override
    public List<OrderDetailDTO> getAllOrderDetails() {
        return orderDetailRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public OrderDetailDTO getOrderDetailById(Integer id) {
        OrderDetail orderDetail = orderDetailRepository.findById(id).orElse(null);
        return convertToDto(orderDetail);
    }

    // ==================== LOGIC TỰ ĐỘNG TÍNH TIỀN KHI THÊM MÓN LẺ ====================
    @Override
    @Transactional
    public OrderDetailDTO createOrderDetail(OrderDetail orderDetail) {
        Order order = orderRepository.findById(orderDetail.getOrder().getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng tương ứng!"));

        // Lấy trạng thái an toàn (nếu null thì coi như Pending)
        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        // CHẶN BẢO VỆ: Đơn hàng đã hoàn tất hoặc bị hủy thì không cho phép thêm món ăn lẻ
        if ("Success".equalsIgnoreCase(currentStatus) || "Sucess".equalsIgnoreCase(currentStatus) || "Canceled".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng đã hoàn tất hoặc bị hủy, không thể thêm món ăn!");
        }

        Food food = foodRepository.findById(orderDetail.getFood().getFoodId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn này!"));

        // Tự động tính toán thành tiền món lẻ
        double currentItemPrice = food.getPrice() * orderDetail.getQuantity();
        orderDetail.setPrice(currentItemPrice);
        orderDetail.setFood(food); // Gán đầy đủ thông tin food để khi chuyển sang DTO có đủ tên món

        OrderDetail savedDetail = orderDetailRepository.save(orderDetail);

        // Cộng dồn ngược lại vào tổng tiền (totalPrice) của Order lớn
        double newTotalPrice = order.getTotalPrice() + currentItemPrice;
        order.setTotalPrice(newTotalPrice);
        orderRepository.save(order);

        return convertToDto(savedDetail);
    }

    // ==================== LOGIC TỰ ĐỘNG TÍNH TIỀN KHI CẬP NHẬT SỐ LƯỢNG MÓN LẺ ====================
    @Override
    @Transactional
    public OrderDetailDTO updateOrderDetail(Integer id, OrderDetail newDetails) {
        OrderDetail oldDetail = orderDetailRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết đơn hàng số: " + id));

        Order order = orderRepository.findById(oldDetail.getOrder().getOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng tương ứng!"));

        String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

        // CHẶN BẢO VỆ: Đơn hàng đã chốt thì không cho chỉnh sửa số lượng
        if ("Success".equalsIgnoreCase(currentStatus) || "Sucess".equalsIgnoreCase(currentStatus) || "Canceled".equalsIgnoreCase(currentStatus)) {
            throw new RuntimeException("Đơn hàng đã hoàn tất hoặc bị hủy, không thể sửa món!");
        }

        Food food = foodRepository.findById(oldDetail.getFood().getFoodId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn!"));

        // Trừ bớt số tiền cũ của món này ra khỏi tổng tiền của Order trước
        double orderPriceWithoutOldItem = order.getTotalPrice() - oldDetail.getPrice();

        // Tính toán lại thành tiền mới dựa trên số lượng mới gửi lên
        oldDetail.setQuantity(newDetails.getQuantity());
        double newItemPrice = food.getPrice() * newDetails.getQuantity();
        oldDetail.setPrice(newItemPrice);

        // Cập nhật lại tổng tiền mới cho Order lớn
        order.setTotalPrice(orderPriceWithoutOldItem + newItemPrice);
        orderRepository.save(order);

        OrderDetail updatedDetail = orderDetailRepository.save(oldDetail);
        return convertToDto(updatedDetail);
    }

    // ==================== LOGIC TỰ ĐỘNG CẬP NHẬT TIỀN KHI XÓA MÓN LẺ ====================
    @Override
    @Transactional
    public void deleteOrderDetail(Integer id) {
        OrderDetail detail = orderDetailRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết đơn hàng số: " + id));

        Order order = detail.getOrder();
        if (order != null) {
            String currentStatus = order.getStatus() != null ? order.getStatus() : "Pending";

            // CHẶN BẢO VỆ: Đơn hàng đã chốt thì không cho phép xóa món
            if ("Success".equalsIgnoreCase(currentStatus) || "Sucess".equalsIgnoreCase(currentStatus) || "Canceled".equalsIgnoreCase(currentStatus)) {
                throw new RuntimeException("Đơn hàng đã hoàn tất hoặc bị hủy, không thể xóa món!");
            }

            // Trừ bớt giá tiền của món bị xóa khỏi tổng tiền đơn hàng
            double newTotalPrice = Math.max(0, order.getTotalPrice() - detail.getPrice());
            order.setTotalPrice(newTotalPrice);
            orderRepository.save(order);
        }

        orderDetailRepository.delete(detail);
    }
}
