package com.honviet.app.service.impl;

import com.honviet.app.entity.Category;
import com.honviet.app.repository.CategoryRepository;
import com.honviet.app.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    // Gọi Repository để bốc hết danh mục dưới database lên
    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Tìm danh mục theo ID, nếu không thấy thì trả về null
    @Override
    public Category getCategoryById(Integer id) {
        return categoryRepository.findById(id).orElse(null);
    }
    @Override
    public Category saveCategory(Category category) {
        // Thêm mới hoặc cập nhật danh mục xuống database
        return categoryRepository.save(category);
    }

    @Override
    public void deleteCategory(Integer id) {
        // Xóa danh mục theo ID dưới database
        categoryRepository.deleteById(id);
    }
}
