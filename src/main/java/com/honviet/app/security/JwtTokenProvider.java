package com.honviet.app.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Chuỗi bí mật dùng để mã hóa Token (Độ dài tối thiểu 256-bit tương đương 32 ký tự)
    private final String JWT_SECRET = "HonVietAppSecretKeySecretKeySecretKey2026";

    // Thời gian hết hạn của token: 1 ngày (tính bằng mili-giây)
    private final long JWT_EXPIRATION = 86400000L;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
    }

    // 1. Hàm tạo ra Token từ thông tin Username
    public String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Hàm trích xuất Username ngược lại từ chuỗi Token
    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // 3. Hàm kiểm tra xem Token gửi lên có hợp lệ hay không
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException ex) {
            System.out.println("Chuỗi Token không hợp lệ");
        } catch (ExpiredJwtException ex) {
            System.out.println("Token đã hết hạn sử dụng");
        } catch (UnsupportedJwtException ex) {
            System.out.println("Token không được hỗ trợ");
        } catch (IllegalArgumentException ex) {
            System.out.println("Chuỗi Token trống");
        }
        return false;
    }
}