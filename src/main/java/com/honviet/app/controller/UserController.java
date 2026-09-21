package com.honviet.app.controller;

import com.honviet.app.dto.LoginDTO;
import com.honviet.app.dto.OrderDTO;
import com.honviet.app.entity.User;
import com.honviet.app.service.EmailService;
import com.honviet.app.service.UserService;
import com.honviet.app.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private com.honviet.app.security.JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Bộ nhớ tạm lưu thông tin đăng ký chờ xác thực OTP (Key: Email, Value: Thông tin User)
    private final Map<String, User> pendingUsers = new ConcurrentHashMap<>();

    // 1. ĐĂNG NHẬP (Kiểm tra trạng thái kích hoạt Email)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginDTO) {
        try {
            User user = userService.findByUsernameOrEmail(loginDTO.getUsernameOrEmail(), loginDTO.getUsernameOrEmail());

            if (user != null && !Boolean.TRUE.equals(user.getIsVerified())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Tài khoản chưa được kích hoạt qua Email! Vui lòng xác thực mã OTP."));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginDTO.getUsernameOrEmail(),
                            loginDTO.getPassword()
                    )
            );

            String token = tokenProvider.generateToken(loginDTO.getUsernameOrEmail());

            Map<String, String> response = new HashMap<>();
            response.put("accessToken", token);
            response.put("tokenType", "Bearer");

            return ResponseEntity.ok(response);

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
        }
    }

    // 2. ĐĂNG KÝ BƯỚC 1: Kiểm tra thông tin & gửi OTP
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            if (user.getUsername() != null && userService.findByUsernameOrEmail(user.getUsername(), "") != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Tên tài khoản này đã được sử dụng!"));
            }
            if (user.getEmail() != null && userService.findByUsernameOrEmail("", user.getEmail()) != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Email này đã được đăng ký!"));
            }
            if (user.getPhoneNumber() != null && userService.findByPhoneNumber(user.getPhoneNumber()) != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Số điện thoại này đã được sử dụng!"));
            }

            // Gán role mặc định nếu chưa truyền vào
            if (user.getRole() == null || user.getRole().trim().isEmpty()) {
                user.setRole("ROLE_USER");
            }

            // Tạo mã OTP ngẫu nhiên 6 chữ số
            String otp = String.format("%06d", new Random().nextInt(999999));

            user.setIsVerified(false);
            user.setOtpCode(otp);
            user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

            // Lưu thông tin vào RAM trước
            pendingUsers.put(user.getEmail(), user);

            // Gửi Email OTP chạy ngầm (Async)
            try {
                emailService.sendOtpEmail(user.getEmail(), otp);
            } catch (Exception e) {
                System.err.println(">>> Lỗi khi gửi Email OTP: " + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Mã OTP đã được gửi tới email của bạn. Vui lòng xác thực để hoàn tất đăng ký!",
                    "email", user.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi máy chủ khi tạo tài khoản: " + e.getMessage()));
        }
    }

    // 3. ĐĂNG KÝ BƯỚC 2: Xác thực mã OTP -> Mã hóa Password & Lưu vào Database
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vui lòng cung cấp đầy đủ email và mã OTP!"));
        }

        User pendingUser = pendingUsers.get(email);

        if (pendingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Yêu cầu đăng ký không tồn tại hoặc đã hết hạn! Vui lòng đăng ký lại."));
        }

        if (pendingUser.getOtpCode() == null || !pendingUser.getOtpCode().equals(otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Mã OTP không chính xác!"));
        }

        if (pendingUser.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            pendingUsers.remove(email);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Mã OTP đã hết hạn! Vui lòng đăng ký lại."));
        }

        // Xác thực thành công: Mã hóa mật khẩu & Lưu chính thức vào Database
        pendingUser.setIsVerified(true);
        pendingUser.setOtpCode(null);
        pendingUser.setOtpExpiryTime(null);

        if (pendingUser.getPassword() != null && !pendingUser.getPassword().startsWith("$2a$")) {
            pendingUser.setPassword(passwordEncoder.encode(pendingUser.getPassword()));
        }

        userService.saveUser(pendingUser); // Lưu vào DB
        pendingUsers.remove(email);       // Xóa thông tin tạm

        return ResponseEntity.ok(Map.of("message", "Xác thực tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ."));
    }

    // 3.1. GỬI LẠI MÃ OTP (/resend-otp)
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Vui lòng cung cấp địa chỉ email!"));
        }

        User pendingUser = pendingUsers.get(email);

        if (pendingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Thông tin đăng ký đã hết hạn. Vui lòng thực hiện đăng ký lại!"));
        }

        // Tạo mã OTP mới và cập nhật thời gian hết hạn 5 phút
        String newOtp = String.format("%06d", new Random().nextInt(999999));
        pendingUser.setOtpCode(newOtp);
        pendingUser.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));

        pendingUsers.put(email, pendingUser);

        // Gửi email bất đồng bộ
        try {
            emailService.sendOtpEmail(email, newOtp);
        } catch (Exception e) {
            System.err.println(">>> Lỗi gửi lại OTP: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("message", "Mã OTP mới đã được gửi tới email của bạn!"));
    }

    // 4. XEM DANH SÁCH (CHỈ ADMIN)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> findAll() {
        return userService.getAllUsers();
    }

    // 5. XEM THÔNG TIN CÁ NHÂN (/me)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Bạn chưa đăng nhập!"));
        }

        String currentUsername = authentication.getName();
        User currentUser = userService.findByUsernameOrEmail(currentUsername, "");

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy thông tin tài khoản!"));
        }

        return ResponseEntity.ok(currentUser);
    }

    // 6. CẬP NHẬT THÔNG TIN CÁ NHÂN (/me)
    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(@RequestBody User updatedData, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Bạn chưa đăng nhập!"));
        }

        String currentUsername = authentication.getName();
        User currentUser = userService.findByUsernameOrEmail(currentUsername, "");

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy thông tin tài khoản!"));
        }

        updatedData.setUserId(currentUser.getUserId());
        updatedData.setUsername(currentUser.getUsername());
        updatedData.setPassword(currentUser.getPassword());
        updatedData.setRole(currentUser.getRole());
        updatedData.setIsVerified(currentUser.getIsVerified());

        User savedUser = userService.saveUser(updatedData);
        return ResponseEntity.ok(savedUser);
    }

    // 7. TỰ XÓA TÀI KHOẢN (/me)
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Bạn chưa đăng nhập!"));
        }

        String currentUsername = authentication.getName();
        User currentUser = userService.findByUsernameOrEmail(currentUsername, "");

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Tài khoản không tồn tại!"));
        }

        userService.deleteUser(currentUser.getUserId());
        return ResponseEntity.ok(Map.of("message", "Xóa tài khoản thành công!"));
    }

    // 8. ADMIN XÓA NGƯỜI KHÁC
    @DeleteMapping("/admin-delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUserByAdmin(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "Admin đã xóa thành công tài khoản có ID: " + id));
    }

    // 9. TẢI ẢNH ĐẠI DIỆN USER (Sử dụng Relative Path tương thích Render)
    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Bạn chưa đăng nhập để đổi ảnh!"));
        }

        try {
            String currentUsername = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(currentUsername, "");

            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Không tìm thấy tài khoản để cập nhật!"));
            }

            String uploadDir = "uploads/avatars/";
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path path = Paths.get(uploadDir + fileName);
            Files.write(path, file.getBytes());

            String avatarUrl = "/uploads/avatars/" + fileName;

            currentUser.setAvatar(avatarUrl);
            User updatedUser = userService.saveUser(currentUser);

            return ResponseEntity.ok(updatedUser);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi tải ảnh đại diện lên máy chủ: " + e.getMessage()));
        }
    }

    // 10. ADMIN CẬP NHẬT THÔNG TIN & PHÂN QUYỀN USER KHÁC
    @PutMapping("/admin-update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateByAdmin(@PathVariable Integer id, @RequestBody User updatedData) {
        User existingUser = userService.getAllUsers().stream()
                .filter(u -> u.getUserId().equals(id))
                .findFirst()
                .orElse(null);

        if (existingUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy tài khoản cần sửa!"));
        }

        existingUser.setUsername(updatedData.getUsername());
        existingUser.setEmail(updatedData.getEmail());
        existingUser.setRole(updatedData.getRole());

        User savedUser = userService.saveUser(existingUser);
        return ResponseEntity.ok(savedUser);
    }

    // 11. XEM DANH SÁCH ĐƠN HÀNG CỦA CHÍNH MÌNH
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Bạn chưa đăng nhập!"));
        }

        String username = principal.getName();
        User user = userService.findByUsernameOrEmail(username, "");
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Không tìm thấy tài khoản!"));
        }

        List<OrderDTO> myOrders = orderService.getOrdersByUserId(user.getUserId());
        return ResponseEntity.ok(myOrders);
    }
}