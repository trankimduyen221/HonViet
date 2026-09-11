package com.honviet.app.controller;

import com.honviet.app.entity.Category;
import com.honviet.app.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin("*")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public Category getCategoryById(@PathVariable Integer id) {
        return categoryService.getCategoryById(id);
    }

    @PostMapping
    public Category createCategory(@RequestBody Category category) {
        return categoryService.saveCategory(category);
    }

    // 💡 SỬA CHUẨN HÀM PUT CẬP NHẬT
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Integer id, @RequestBody Category categoryDetails) {
        Category existingCategory = categoryService.getCategoryById(id);

        if (existingCategory == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không tìm thấy danh mục ID: " + id));
        }

        // Cập nhật các trường thông tin
        existingCategory.setCategoryName(categoryDetails.getCategoryName());
        existingCategory.setDescription(categoryDetails.getDescription());

        Category updatedCategory = categoryService.saveCategory(existingCategory);
        return ResponseEntity.ok(updatedCategory);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategoryById(@PathVariable Integer id) {
        try {
            categoryService.deleteCategory(id);
            return ResponseEntity.ok(Map.of("message", "Xóa danh mục thành công: " + id));
        } catch (Exception e) {
            // Trả về thông báo lỗi rõ ràng nếu vướng ràng buộc khóa ngoại với món ăn
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể xóa! Danh mục này đang chứa các món ăn trong hệ thống."));
        }
    }
}