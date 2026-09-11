package com.honviet.app.controller;

import com.honviet.app.dto.OrderDTO;
import com.honviet.app.entity.Order;
import com.honviet.app.entity.User;
import com.honviet.app.service.OrderService;
import com.honviet.app.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin("*") // Giúp React kết nối API không bị lỗi CORS
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserService userService;

    // 1. LẤY HẾT ĐƠN HÀNG (CHỈ ADMIN) - Đổ lên bảng Quản lý Đơn hàng của Horizon UI
    // URL: GET http://localhost:8080/api/orders
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public List<OrderDTO> getAllOrders() {
        return orderService.getAllOrders();
    }

    // 2. TÌM ĐƠN HÀNG THEO ID - Xem chi tiết đơn
    // URL: GET http://localhost:8080/api/orders/1
    @GetMapping("/{id}")
    public OrderDTO getOrderById(@PathVariable Integer id) {
        return orderService.getOrderById(id);
    }

    // 3. THÊM MỚI ĐƠN HÀNG (Khách hàng tạo đơn khi bấm Thanh Toán)
    // URL: POST http://localhost:8080/api/orders
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order, Authentication authentication) {
        try {
            // Lấy thông tin User hiện tại từ Token
            String currentUsername = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(currentUsername, "");

            // Gán User vào đơn hàng một cách tự động và an toàn
            order.setUser(currentUser);

            // Lưu đơn hàng
            OrderDTO createdOrder = orderService.saveOrder(order);

            return ResponseEntity.ok(createdOrder);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi tạo đơn hàng: " + e.getMessage());
        }
    }

    // 4. LẤY LỊCH SỬ ĐƠN HÀNG CỦA KHÁCH HÀNG DỰA TRÊN TOKEN
    // URL: GET http://localhost:8080/api/orders/my-orders
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(currentUsername, "");
            List<OrderDTO> userOrders = orderService.getOrdersByUserId(currentUser.getUserId());
            return ResponseEntity.ok(userOrders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi lấy lịch sử đơn hàng: " + e.getMessage());
        }
    }

    // ==================== PHẦN CẬP NHẬT TỰ ĐỘNG & BẢO MẬT PHÂN QUYỀN ====================

    // 5a. ADMIN: Cập nhật trạng thái đơn hàng
    // URL: PUT http://localhost:8080/api/orders/1/status?status=Delivering
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> updateOrderStatus(@PathVariable Integer id, @RequestParam String status) {
        try {
            orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok("Cập nhật trạng thái đơn hàng số " + id + " thành [" + status + "] thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi cập nhật trạng thái: " + e.getMessage());
        }
    }

    // 5b. ADMIN: Gán shipper chịu trách nhiệm đi giao đơn
    // URL: PUT http://localhost:8080/api/orders/1/assign-shipper
    @PutMapping("/{id}/assign-shipper")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<String> assignShipper(@PathVariable Integer id, @RequestBody User shipper) {
        try {
            orderService.assignShipper(id, shipper);
            return ResponseEntity.ok("Gán shipper thành công cho đơn hàng số " + id);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi gán shipper: " + e.getMessage());
        }
    }

    // 5c. USER: Tự cập nhật địa chỉ/sđt nhận hàng (Chỉ được sửa đơn của chính mình)
    // URL: PUT http://localhost:8080/api/orders/1/shipping-info
    @PutMapping("/{id}/shipping-info")
    public ResponseEntity<String> updateShippingInfo(@PathVariable Integer id, @RequestBody Order order, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(currentUsername, "");
            OrderDTO currentOrder = orderService.getOrderById(id);

            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(r -> r.getAuthority().equals("ADMIN") || r.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && !currentOrder.getUser().getUserId().equals(currentUser.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không có quyền chỉnh sửa đơn hàng của người khác!");
            }

            orderService.updateShippingInfo(id, order);
            return ResponseEntity.ok("Cập nhật thông tin giao hàng cho đơn số " + id + " thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi cập nhật thông tin: " + e.getMessage());
        }
    }

    // 6. TỰ ĐỘNG HỦY ĐƠN HÀNG (Có giới hạn 10 phút cho USER thường)
    // URL: PUT http://localhost:8080/api/orders/1/cancel
    @PutMapping("/{id}/cancel")
    public ResponseEntity<String> cancelOrder(@PathVariable Integer id, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userService.findByUsernameOrEmail(currentUsername, "");
            OrderDTO currentOrder = orderService.getOrderById(id);

            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(r -> r.getAuthority().equals("ADMIN") || r.getAuthority().equals("ROLE_ADMIN"));
            String roleCalculated = isAdmin ? "ADMIN" : "USER";

            if (!isAdmin) {
                if (!currentOrder.getUser().getUserId().equals(currentUser.getUserId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Bạn không thể hủy đơn hàng của người khác!");
                }

                if (!"Pending".equalsIgnoreCase(currentOrder.getStatus())) {
                    return ResponseEntity.badRequest().body("Đơn hàng đã được xử lý hoặc giao đi, không thể tự hủy!");
                }
            }

            orderService.cancelOrder(id, roleCalculated);
            return ResponseEntity.ok("Hủy đơn hàng số " + id + " thành công bởi [" + roleCalculated + "]");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi hủy đơn: " + e.getMessage());
        }
    }

    // ==================== PHẦN DÀNH RIÊNG CHO SHIPPER ====================

    // 7. SHIPPER: Lấy danh sách các đơn hàng chờ nhận giao (Pending)
    // URL: GET http://localhost:8080/api/orders/available-for-shipper
    @GetMapping("/available-for-shipper")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'SHIPPER', 'ROLE_SHIPPER')")
    public ResponseEntity<?> getAvailableOrdersForShipper() {
        try {
            List<OrderDTO> availableOrders = orderService.getOrdersByStatuses(Arrays.asList("Pending", "PENDING"));
            return ResponseEntity.ok(availableOrders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi lấy danh sách đơn chờ nhận giao: " + e.getMessage());
        }
    }

    // 8. SHIPPER: Lấy danh sách các đơn do chính Shipper đăng nhập hiện tại đảm nhận
    // URL: GET http://localhost:8080/api/orders/my-delivering-orders
    @GetMapping("/my-delivering-orders")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'SHIPPER', 'ROLE_SHIPPER')")
    public ResponseEntity<?> getMyDeliveringOrders(Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentShipper = userService.findByUsernameOrEmail(currentUsername, "");
            List<OrderDTO> myOrders = orderService.getOrdersByShipperId(currentShipper.getUserId());
            return ResponseEntity.ok(myOrders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi lấy danh sách đơn hàng của Shipper: " + e.getMessage());
        }
    }

    // 9. LẤY TOÀN BỘ ĐƠN HÀNG ĐANG GIAO (Chỉ Shipper và Admin mới được xem)
    // URL: GET http://localhost:8080/api/orders/all-shipping
    @GetMapping("/all-shipping")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'SHIPPER', 'ROLE_SHIPPER')")
    public ResponseEntity<?> getAllShippingOrders() {
        try {
            List<OrderDTO> shippingOrders = orderService.getOrdersByStatus("Delivering");
            return ResponseEntity.ok(shippingOrders);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi lấy danh sách đơn đang giao: " + e.getMessage());
        }
    }

    // 10. SHIPPER: Nhận giao đơn hàng hoặc Cập nhật trạng thái (Success / Canceled)
    // URL: PUT http://localhost:8080/api/orders/1/shipper-status?status=Delivering
    @PutMapping("/{id}/shipper-status")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN', 'SHIPPER', 'ROLE_SHIPPER')")
    public ResponseEntity<String> shipperUpdateStatus(
            @PathVariable Integer id,
            @RequestParam String status,
            Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentShipper = userService.findByUsernameOrEmail(currentUsername, "");

            // Nếu Shipper bấm "Nhận đơn", gán Shipper vào đơn và chuyển trạng thái sang Delivering
            if ("Delivering".equalsIgnoreCase(status)) {
                orderService.assignShipper(id, currentShipper);
                return ResponseEntity.ok("Shipper đã nhận giao đơn hàng số " + id + " thành công!");
            }

            // Đồng bộ trạng thái: Chấp nhận "Success" (Đã giao xong) và "Canceled" (Khách không lấy)
            if (!"Success".equalsIgnoreCase(status) && !"Canceled".equalsIgnoreCase(status)) {
                return ResponseEntity.badRequest().body("Trạng thái shipper cập nhật không hợp lệ! Chỉ chấp nhận [Delivering], [Success] hoặc [Canceled]");
            }

            // Gọi xuống Service để cập nhật trạng thái
            orderService.shipperUpdateStatus(id, status);
            return ResponseEntity.ok("Cập nhật trạng thái đơn số " + id + " thành [" + status + "] thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lỗi: " + e.getMessage());
        }
    }
}