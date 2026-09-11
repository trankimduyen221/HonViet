package com.honviet.app.repository;

import com.honviet.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Tìm người dùng bằng Username HOẶC Email
    Optional<User> findByUsernameOrEmail(String username, String email);
    User findByPhoneNumber(String phoneNumber);

    User findByUsername(String username);

    Optional<User> findByEmail(String email);
}
