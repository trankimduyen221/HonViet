package com.honviet.app.service;

import com.honviet.app.entity.Category;

import java.util.List;

public interface CategoryService {
    List<Category> getAllCategories();

    // Tìm danh mục theo ID, nếu không thấy thì trả về null
    Category getCategoryById(Integer id);

    Category saveCategory(Category category);

    void deleteCategory(Integer id);
}
