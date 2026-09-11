package com.honviet.app.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode);
}