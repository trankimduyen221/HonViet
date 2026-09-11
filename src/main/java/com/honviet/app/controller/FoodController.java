package com.honviet.app.controller;

import com.honviet.app.entity.Food;
import com.honviet.app.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/foods")
@CrossOrigin("*") // Dòng này để VS Code gọi API thoải mái không bị block
public class FoodController {

    @Autowired
    private FoodService foodService;

    // 1. LẤY HẾT MÓN ĂN (Read All) - Mở công khai để khách hàng lướt menu
    // Đường link tương ứng: GET http://localhost:8080/api/foods
    @GetMapping
    public List<Food> getAllFoods() {
        return (List<Food>) foodService.getAllFoods();
    }

    // 2. TÌM MÓN ĂN THEO ID (Read One) - Mở công khai để xem chi tiết món
    // Đường link tương ứng: GET http://localhost:8080/api/foods/1
    @GetMapping("/{id}")
    public Food getFoodById(@PathVariable Integer id) {
        return foodService.getFoodById(id);
    }

    // 3. THÊM MỚI MÓN ĂN (Create) - CHỈ ADMIN ĐƯỢC PHÉP
    // Đường link tương ứng: POST http://localhost:8080/api/foods
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Food createFood(@RequestBody Food food) {
        return foodService.saveFood(food);
    }

    // 4. CẬP NHẬT MÓN ĂN (Update) - CHỈ ADMIN ĐƯỢC PHÉP
    // Đường link tương ứng: PUT http://localhost:8080/api/foods/1
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Food updateFood(@PathVariable Integer id, @RequestBody Food food) {
        // Đảm bảo là cập nhật đúng món ăn có ID truyền trên đường link
        food.setFoodId(id);
        return foodService.saveFood(food);
    }

    // 5. XÓA MÓN ĂN (Delete)
    // Đường link tương ứng: DELETE http://localhost:8080/api/foods/1
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public String deleteFoodById(@PathVariable Integer id) {
        foodService.deleteFood(id);
        return "Xóa món ăn thành công: " + id;
    }

    // 6. ADMIN UP HÌNH ĐỒ ĂN (Chấp nhận JPG, JPEG, PNG, WEBP và chống sập server)
    // URL: POST http://localhost:8080/api/foods/upload
    @PostMapping("/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> uploadFoodImage(@RequestParam("file") MultipartFile file) {
        // 1. Kiểm tra nếu admin chưa chọn file
        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vui lòng chọn một file ảnh để tải lên!"));
        }

        // 2. Kiểm tra định dạng file (Chấp nhận jpg, jpeg, png, webp)
        String contentType = file.getContentType();
        if (contentType == null ||
                !(contentType.equals("image/jpeg") ||
                        contentType.equals("image/png") ||
                        contentType.equals("image/webp"))) {

            // Trả về lỗi 400 êm đẹp cho Frontend bắt và hiển thị thông báo, tuyệt đối KHÔNG làm sập web
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Định dạng file không hỗ trợ! Hệ thống chỉ nhận ảnh JPG, JPEG, PNG, hoặc WEBP."));
        }

        try {
            // Xác định thư mục lưu trữ ảnh đồ ăn riêng biệt
            String uploadDir = "uploads/foods/";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            // Sinh tên file không lo bị đè dữ liệu cũ
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir + fileName);

            // Ghi dữ liệu file
            Files.write(path, file.getBytes());

            // Đường link đầy đủ để gắn vào trường imageUrl của bản ghi Food
            String imageUrl = "http://localhost:8080/uploads/foods/" + fileName;

            // Trả về định dạng Object JSON đúng chuẩn như React cần
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));

        } catch (Exception e) {
            // Bắt mọi ngoại lệ phát sinh khi ghi file để bảo vệ server
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi hệ thống khi ghi file ảnh: " + e.getMessage()));
        }
    }
}