# 🍃 Hồn Việt — Nền tảng Đặt đồ ăn & Văn hóa Việt Nam

<div align="center">
  <p><b>Ứng dụng web full-stack hiện đại hỗ trợ khám phá ẩm thực Việt Nam và đặt món ăn trực tuyến.</b></p>
  
  <p>
    <a href="[https://hon-viet-mu.vercel.app/](https://hon-viet-mu.vercel.app/)" target="_blank">🌐 Live Frontend Demo</a> •
    <a href="[https://honviet-ryt3.onrender.com/](https://honviet-ryt3.onrender.com/)" target="_blank">⚙️ Backend API</a>
  </p>
</div>

---

## 📖 Giới thiệu dự án

**Hồn Việt** là ứng dụng web đặt đồ ăn trực tuyến kết nối người dùng với các món ăn truyền thống Việt Nam. Dự án tập trung vào kiến trúc Backend, cơ chế xác thực tài khoản an toàn qua token (JWT), dịch vụ gửi email OTP tin cậy và tối ưu hạ tầng điện toán đám mây (Cloud) để duy trì khả năng truy cập 24/7 trên môi trường miễn phí.

---

## 🚀 Tính năng nổi bật & Điểm mạnh kỹ thuật

### 1. 📧 Dịch vụ gửi email OTP ổn định (Brevo REST API)
- Chuyển đổi từ SMTP truyền thống sang **Brevo REST API** nhằm vượt qua rào cản chặn cổng SMTP trên máy chủ Cloud (Render).
- Đảm bảo tỉ lệ chuyển tiếp email đạt 100% khi người dùng đăng ký tài khoản và nhận mã OTP xác thực trên tất cả nhà mạng email (Gmail, Yahoo, Hotmail...).

### 2. ⏰ Duy trì hệ thống 24/7 & Khắc phục độ trễ Cold-Start
- Thiết kế endpoint kiểm tra sức khỏe hệ thống `/ping` (`HealthController`) cực nhẹ, trả về phản hồi `200 OK` với tài nguyên tối thiểu.
- Tích hợp công cụ **`cron-job.org`** tự động gửi request mỗi 5 phút, loại bỏ hoàn toàn độ trễ khởi động lại (Cold Start 30–50s) trên gói Render Free Tier.

### 3. 🔒 Bảo mật & Phân quyền chi tiết (RBAC)
- Bảo vệ các REST API bằng **Spring Security** kết hợp xác thực **JWT (JSON Web Token)** phi trạng thái.
- Phân quyền truy cập theo vai trò người dùng: `ADMIN`, `USER`, và `SHIPPER`.
- Cấu hình chính xác chính sách CORS và cho phép truy cập công khai (whitelist) các endpoint cần thiết (`/api/users/login`, `/api/foods/**`, `/ping`...).

### 4. 🐳 Đóng gói & Triển khai 
- Tự động hóa quy trình build và deploy trực tiếp từ GitHub lên **Render** (Backend) và **Vercel** (Frontend).

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

- **Backend:** Java, Spring Boot, Spring Security, JWT, RESTful API
- **Cơ sở dữ liệu & Lưu trữ:** Relational Database, Upload file (`/uploads/**`)
- **DevOps & Cloud:** Docker, Render, Vercel, `cron-job.org`
- **Dịch vụ bên thứ ba:** Brevo API (Transactional Emails)

---

## 📂 Cấu trúc thư mục dự án

```text
src/main/java/com/honviet/app
│
├── controller/        # REST Controllers (HealthController, AuthController, FoodController...)
├── security/          # Cấu hình Spring Security, JWT filters & providers
├── service/           # Xử lý logic nghiệp vụ (Brevo email integration, Orders, Users)
├── repository/        # Spring Data JPA repositories
└── model/             # Entity models & DTOs

```

---

## ⚙️ Hướng dẫn cài đặt và chạy Local (Getting Started)

Nếu bạn muốn chạy thử dự án Backend này trên máy cá nhân, hãy thực hiện các bước sau:

### 1. Yêu cầu hệ thống chuẩn bị trước

* Java Development Kit (JDK 17 hoặc mới hơn)
* Maven
* MySQL Server (đã tạo sẵn database tên là `honviet`)

### 2. Clone repository

```bash
git clone https://github.com/trankimduyen221/honviet.git
cd honviet

```

### 3. Cấu hình biến môi trường (`application.properties` hoặc `.env`)

Tạo hoặc cấu hình các thông số kết nối Database và Brevo API Key vào file cấu hình:

```env
PORT=8080
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/honviet?useSSL=false&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=your_mysql_password
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender@gmail.com

```

### 4. Build và Chạy ứng dụng Spring Boot

Chạy lệnh Maven Wrapper tại thư mục gốc của dự án:

* **Trên Linux / macOS:**
```bash
./mvnw spring-boot:run

```


* **Trên Windows (CMD / PowerShell):**
```cmd
mvnw.cmd spring-boot:run

```

Sau khi ứng dụng khởi động thành công, Backend sẽ sẵn sàng tại: `http://localhost:8080` 🎉

