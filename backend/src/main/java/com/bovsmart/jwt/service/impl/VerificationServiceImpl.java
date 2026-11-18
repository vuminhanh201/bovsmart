package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.exception.AppException;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.model.VerificationCode;
import com.bovsmart.jwt.repository.VerificationCodeRepository;
import com.bovsmart.jwt.service.EmailService;
import com.bovsmart.jwt.service.VerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class VerificationServiceImpl implements VerificationService {

    private static final Logger logger = LoggerFactory.getLogger(VerificationServiceImpl.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    private final VerificationCodeRepository verificationCodeRepository;
    private final EmailService emailService;

    @Value("${app.auth.verification.expiration-minutes:10}")
    private long expirationMinutes;

    @Autowired
    public VerificationServiceImpl(VerificationCodeRepository verificationCodeRepository, EmailService emailService) {
        this.verificationCodeRepository = verificationCodeRepository;
        this.emailService = emailService;
    }

    @Override
    public VerificationCode generateAndSendPasswordResetCode(User user) {
        // 1. Lấy danh sách các mã xác minh trước đó của email này để đảm bảo mã mới không trùng
        List<VerificationCode> pastCodes = verificationCodeRepository.findByEmail(user.getEmail());
        Set<String> usedCodes = pastCodes.stream()
                .map(VerificationCode::getCode)
                .collect(Collectors.toSet());

        // 2. Xóa các mã đặt lại mật khẩu cũ chưa sử dụng của email này
        verificationCodeRepository.deleteByEmailAndType(user.getEmail(), "PASSWORD_RESET");

        // 3. Sinh mã 6 số ngẫu nhiên bằng SecureRandom (không trùng với mã trước đó)
        String code = generateUniqueRandomCode(usedCodes);

        // 4. Thời hạn hiệu lực: 10 phút
        Instant expiryDate = Instant.now().plus(expirationMinutes, ChronoUnit.MINUTES);

        // 5. Lưu mã xác minh và thời gian hết hạn vào MongoDB
        VerificationCode verificationCode = new VerificationCode(
                code,
                user.getEmail(),
                user.getId(),
                expiryDate,
                "PASSWORD_RESET"
        );
        VerificationCode savedCode = verificationCodeRepository.save(verificationCode);

        // 6. Gửi email chứa mã xác minh HTML qua Gmail SMTP
        emailService.sendPasswordResetOtpEmail(user.getEmail(), user.getUsername(), code);

        return savedCode;
    }

    @Override
    public void verifyResetCode(String email, String code) {
        Instant now = Instant.now();

        // Tìm mã xác minh loại PASSWORD_RESET chưa được verified
        Optional<VerificationCode> codeOpt = verificationCodeRepository
                .findByEmailAndCodeAndTypeAndVerifiedFalse(email, code, "PASSWORD_RESET");

        if (codeOpt.isEmpty()) {
            throw new AppException("Mã xác minh không chính xác hoặc đã được sử dụng!");
        }

        VerificationCode verificationCode = codeOpt.get();

        // Kiểm tra thời hạn 10 phút
        if (verificationCode.getExpiryDate().isBefore(now)) {
            verificationCodeRepository.delete(verificationCode);
            throw new AppException("Mã xác minh đã hết hạn (quá 10 phút)! Vui lòng yêu cầu gửi mã mới.");
        }
    }

    /**
     * Sinh mã 6 số ngẫu nhiên bằng SecureRandom đảm bảo không trùng các mã trước đó của người dùng
     * và không trùng bất kỳ mã đang còn hiệu lực nào trong hệ thống.
     */
    private String generateUniqueRandomCode(Set<String> usedCodes) {
        String code;
        int maxAttempts = 100;
        int attempts = 0;
        Instant now = Instant.now();

        do {
            int number = 100000 + secureRandom.nextInt(900000);
            code = String.valueOf(number);
            attempts++;
            if (attempts > maxAttempts) {
                break;
            }
        } while (usedCodes.contains(code) || verificationCodeRepository.existsByCodeAndExpiryDateAfterAndVerifiedFalse(code, now));

        return code;
    }
}

