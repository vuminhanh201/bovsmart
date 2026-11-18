package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.exception.AppException;
import com.bovsmart.jwt.exception.TokenRefreshException;
import com.bovsmart.jwt.model.RefreshToken;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.repository.RefreshTokenRepository;
import com.bovsmart.jwt.repository.UserRepository;
import com.bovsmart.jwt.service.RefreshTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Autowired
    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Override
    public RefreshToken createRefreshToken(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Không tìm thấy người dùng với id: " + userId));

        // Sinh token ngẫu nhiên UUID duy nhất
        String tokenString = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plusMillis(refreshTokenDurationMs);

        RefreshToken refreshToken = new RefreshToken(tokenString, user, expiryDate);
        return refreshTokenRepository.save(refreshToken);
    }

    @Override
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException(token.getToken(),
                    "Phiên đăng nhập (Refresh token) đã hết hạn. Vui lòng đăng nhập lại tài khoản!");
        }
        return token;
    }

    @Override
    @Transactional
    public void deleteByUserId(String userId) {
        // Xóa toàn bộ refresh token liên kết với user này để đăng xuất khỏi tất cả thiết bị
        refreshTokenRepository.deleteByUser_Id(userId);
    }
}

