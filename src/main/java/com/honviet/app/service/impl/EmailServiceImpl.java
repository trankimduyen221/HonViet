package com.honviet.app.service.impl;

import com.honviet.app.service.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class EmailServiceImpl implements EmailService {

    @Value("${RESEND_API_KEY}")
    private String resendApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Async
    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            String url = "https://api.resend.com/emails";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(resendApiKey);

            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px;'>"
                    + "<h2 style='color: #930a0a; text-align: center;'>HỒN VIỆT FOODS</h2>"
                    + "<p>Chào bạn,</p>"
                    + "<p>Mã OTP để hoàn tất đăng ký tài khoản của bạn là:</p>"
                    + "<div style='text-align: center; margin: 20px 0;'>"
                    + "<span style='font-size: 28px; font-weight: bold; color: #930a0a; letter-spacing: 5px; background: #f8f9fa; padding: 10px 20px; border-radius: 6px; border: 1px dashed #930a0a;'>" + otpCode + "</span>"
                    + "</div>"
                    + "<p>Mã có hiệu lực trong <b>5 phút</b>.</p>"
                    + "</div>";

            Map<String, Object> body = new HashMap<>();
            body.put("from", "HonViet <onboarding@resend.dev>");
            body.put("to", List.of(toEmail));
            body.put("subject", "Mã xác thực đăng ký tài khoản - Hồn Việt Foods");
            body.put("html", htmlContent);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println(">>> [EmailService] Gửi email OTP thành công tới: " + toEmail);
            } else {
                System.err.println(">>> [EmailService] Lỗi gửi mail: " + response.getBody());
            }
        } catch (Exception e) {
            System.err.println(">>> [EmailService] Lỗi kết nối API Resend: " + e.getMessage());
        }
    }
}