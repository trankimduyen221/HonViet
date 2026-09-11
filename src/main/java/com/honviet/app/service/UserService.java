package com.honviet.app.service;

import com.honviet.app.entity.User;

import java.util.List;

public interface UserService {
    List<User> getAllUsers();

    User saveUser(User user);

    void deleteUser(Integer id);

    User findByUsernameOrEmail(String username, String email);

    User findByPhoneNumber(String phoneNumber);

    User findByUsername(String username);

    // Bổ sung hàm này để Controller tìm chính xác User theo Email khi xác nhận OTP
    User findByEmail(String email);
}
