package com.honviet.app;

import com.honviet.app.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class HonVietApplication {

    public static void main(String[] args) {
        SpringApplication.run(HonVietApplication.class, args);
    }
    // Tự động kích hoạt isVerified = true cho tài khoản cũ (chưa từng tạo mã OTP)
    @Bean
    public CommandLineRunner initDatabase(UserRepository userRepository) {
        return args -> {
            userRepository.findAll().forEach(user -> {
                // Dùng Boolean.TRUE.equals để an toàn với cả giá trị null
                boolean isAlreadyVerified = Boolean.TRUE.equals(user.getIsVerified());

                if (!isAlreadyVerified && user.getOtpCode() == null) {
                    user.setIsVerified(true);
                    userRepository.save(user);
                }
            });
            System.out.println(">>> Đã tự động kích hoạt trạng thái cho các tài khoản cũ trong Database!");
        };
    }
}
