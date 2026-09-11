package com.honviet.app.security;

import com.honviet.app.entity.User;
import com.honviet.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserService userService; // Gọi qua tầng Service gốc của bạn

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Sử dụng hàm cũ của bạn, trả về đối tượng User trực tiếp
        User user = userService.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail);

        if (user == null) {
            throw new UsernameNotFoundException("Không tìm thấy người dùng với tài khoản/email: " + usernameOrEmail);
        }

        // Bọc vào CustomUserDetails để Spring Security xử lý bảo mật
        return new CustomUserDetails(user);
    }
}