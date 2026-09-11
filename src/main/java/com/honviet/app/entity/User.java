package com.honviet.app.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "phone_number", unique = true, length = 15)
    private String phoneNumber;

    @Column(name = "role", nullable = false, length = 20)
    private String role = "Customer";

    @Column(name = "avatar", length = 255)
    private String avatar; // Lưu đường dẫn URL của ảnh đại diện

    // --- CÁC TRƯỜNG BỔ SUNG CHO TÍNH NĂNG OTP ---
    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "otp_code", length = 10)
    private String otpCode;

    @Column(name = "otp_expiry_time")
    private LocalDateTime otpExpiryTime;
}
