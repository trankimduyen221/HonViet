package com.honviet.app.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @Column(name = "total_price", nullable = false)
    private Double totalPrice = 0.0;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "Pending";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // 1. Khách hàng đặt món (Liên kết tới bảng users)
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // 2. Người đi giao hàng (Shipper - liên kết tới bảng users)
    @ManyToOne
    @JoinColumn(name = "shipper_id")
    private User shipper;

    @Column(name = "shipping_address")
    private String shippingAddress;

    @Column(name = "phone_number", length = 15)
    private String phoneNumber;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "payment_method")
    private String paymentMethod;

    // KẾT NỐI SANG BẢNG OrderDetail
    // CascadeType.ALL giúp tự động lưu đống OrderDetail khi lưu Order lớn
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<OrderDetail> orderDetails;
}