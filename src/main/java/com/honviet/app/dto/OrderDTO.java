package com.honviet.app.dto;

import com.honviet.app.entity.User;

import java.time.LocalDateTime;
import java.util.List;

public class OrderDTO {
    private Integer orderId;
    private Double totalPrice;
    private String status;
    private String createdAt;
    private String shippingAddress;
    private String phoneNumber;
    private String receiverName;
    private String paymentMethod;
    private User user; // <-- Thêm đối tượng User vào đây để biết ai mua đơn này
    private List<OrderDetailDTO> orderDetails;

    // Getters và Setters
    public Integer getOrderId() { return orderId; }
    public void setOrderId(Integer orderId) { this.orderId = orderId; }

    public Double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(Double totalPrice) { this.totalPrice = totalPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getReceiverName() { return receiverName; }
    public void setReceiverName(String receiverName) { this.receiverName = receiverName; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    // Thêm Getter và Setter cho User
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public List<OrderDetailDTO> getOrderDetails() { return orderDetails; }
    public void setOrderDetails(List<OrderDetailDTO> orderDetails) { this.orderDetails = orderDetails; }

    // Thêm hàm này vào cuối file OrderDTO.java để tự động đổi ngày giờ sang dạng tính toán được
    public LocalDateTime getOrderDate() {
        if (this.createdAt == null || this.createdAt.isEmpty()) {
            return null;
        }
        try {
            // Thử chuyển đổi nếu chuỗi có dạng chuẩn ISO (ví dụ: 2026-07-15T11:00:00)
            return LocalDateTime.parse(this.createdAt);
        } catch (Exception e) {
            try {
                // Thử chuyển đổi nếu chuỗi có dạng ngày giờ Việt Nam (yyyy-MM-dd HH:mm:ss)
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                return LocalDateTime.parse(this.createdAt, formatter);
            } catch (Exception ex) {
                return null;
            }
        }
    }

    public void setShipper(User shipper) {
    }
}