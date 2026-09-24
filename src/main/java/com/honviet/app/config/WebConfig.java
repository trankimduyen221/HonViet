package com.honviet.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Cấu hình CORS toàn cục cho tất cả endpoint
        registry.addMapping("/**")
                .allowedOriginPatterns("*") // Cho phép tất cả Origin, tương thích tốt với allowCredentials(true)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD")
                .allowedHeaders("*")
                .allowCredentials(true); // Cho phép gửi kèm Cookie / Token xác thực
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Lấy URI chuẩn tuyệt đối của thư mục "uploads" (Chạy tốt trên cả Windows và Linux/Render)
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toUri().toString();

        // Biến /uploads/** thành tài nguyên tĩnh truy cập công khai
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}