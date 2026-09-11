package com.honviet.app.service.impl;

import com.honviet.app.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Mã xác thực đăng ký tài khoản - Hồn Việt Foods");

            String htmlContent = "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; max-width: 500px;'>"
                    + "<h2 style='color: #930a0a; text-align: center;'>HỒN VIỆT FOODS</h2>"
                    + "<p>Chào bạn,</p>"
                    + "<p>Mã OTP để hoàn tất đăng ký tài khoản của bạn là:</p>"
                    + "<div style='text-align: center; margin: 20px 0;'>"
                    + "<span style='font-size: 28px; font-weight: bold; color: #930a0a; letter-spacing: 5px; background: #f8f9fa; padding: 10px 20px; border-radius: 6px; border: 1px dashed #930a0a;'>" + otpCode + "</span>"
                    + "</div>"
                    + "<p>Mã có hiệu lực trong <b>5 phút</b>. Nếu bạn không thực hiện đăng ký, vui lòng bỏ qua email này.</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Không thể gửi email. Vui lòng kiểm tra địa chỉ email!", e);
        }
    }
}
