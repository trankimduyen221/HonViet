package com.honviet.app.service.impl;

import com.honviet.app.repository.FoodRepository;
import com.honviet.app.entity.Food;
import com.honviet.app.service.FoodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FoodServiceImpl implements FoodService {

    @Autowired
    private FoodRepository foodRepository;

    // lấy hết món ăn
    @Override
    public List<Food> getAllFoods() {
        return foodRepository.findAll();
    }

    // tìm theo món ID
    @Override
    public Food getFoodById(Integer id) {
        return foodRepository.findById(id).orElse(null);
    }
     // lưu, cập nhật món ăn
     @Override
     public Food saveFood(Food food) {
        return foodRepository.save(food);
    }

     // xóa món ăn theo ID
     @Override
     public void deleteFood(Integer id) {
        foodRepository.deleteById(id);
    }
}
