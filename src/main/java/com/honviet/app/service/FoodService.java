package com.honviet.app.service;

import com.honviet.app.entity.Food;

public interface FoodService {
    Iterable<Food> getAllFoods();

    // tìm theo món ID
    Food getFoodById(Integer id);

    // lưu, cập nhật món ăn
    Food saveFood(Food food);

    // xóa món ăn theo ID
    void deleteFood(Integer id);
}
