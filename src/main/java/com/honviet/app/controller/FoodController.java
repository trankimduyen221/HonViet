package com.honviet.app.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.honviet.app.entity.Food;
import com.honviet.app.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    @Autowired
    private FoodService foodService;

    // Đọc thông số cấu hình Cloudinary từ Environment Variables
    private final Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
            "cloud_name", System.getenv("CLOUDINARY_CLOUD_NAME"),
            "api_key", System.getenv("CLOUDINARY_API_KEY"),
            "api_secret", System.getenv("CLOUDINARY_API_SECRET")
    ));

    // 1. LẤY HẾT MÓN ĂN (Read All)
    @GetMapping
    public List<Food> getAllFoods() {
        return (List<Food>) foodService.getAllFoods();
    }

    // 2. TÌM MÓN ĂN THEO ID (Read One)
    @GetMapping("/{id}")
    public Food getFoodById(@PathVariable Integer id) {
        return foodService.getFoodById(id);
    }

    // 3. THÊM MỚI MÓN ĂN (Create) - CHỈ ADMIN ĐƯỢC PHÉP
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Food createFood(@RequestBody Food food) {
        return foodService.saveFood(food);
    }

    // 4. CẬP NHẬT MÓN ĂN (Update) - CHỈ ADMIN ĐƯỢC PHÉP
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Food updateFood(@PathVariable Integer id, @RequestBody Food food) {
        food.setFoodId(id);
        return foodService.saveFood(food);
    }

    // 5. XÓA MÓN ĂN (Delete) - CHỈ ADMIN ĐƯỢC PHÉP
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteFoodById(@PathVariable Integer id) {
        foodService.deleteFood(id);
        return "Xóa món ăn thành công: " + id;
    }

    // 6. ADMIN UPLOAD HÌNH ĐỒ ĂN LÊN CLOUDINARY
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadFoodImage(@RequestParam("file") MultipartFile file) {

        // 1. Kiểm tra nếu file rỗng
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vui lòng chọn một file ảnh để tải lên!"));
        }

        // 2. Kiểm tra định dạng file ảnh
        String contentType = file.getContentType();
        if (contentType == null ||
                !(contentType.equals("image/jpeg") ||
                        contentType.equals("image/png") ||
                        contentType.equals("image/webp"))) {

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Định dạng file không hỗ trợ! Hệ thống chỉ nhận ảnh JPG, JPEG, PNG, hoặc WEBP."));
        }

        try {
            // Upload trực tiếp file lên Cloudinary vào thư mục "foods"
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", "foods"));

            // Lấy HTTPS URL ảnh vĩnh viễn từ Cloudinary
            String imageUrl = uploadResult.get("secure_url").toString();

            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi tải ảnh lên Cloudinary: " + e.getMessage()));
        }
    }
}