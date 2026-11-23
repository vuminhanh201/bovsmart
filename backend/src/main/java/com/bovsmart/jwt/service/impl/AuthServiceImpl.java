
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.LoginRequest;
import com.bovsmart.jwt.dto.request.RegisterRequest;
import com.bovsmart.jwt.dto.request.CreateAccountRequest;
import com.bovsmart.jwt.dto.response.JwtResponse;
import com.bovsmart.jwt.dto.response.TokenRefreshResponse;
import com.bovsmart.jwt.exception.AppException;
import com.bovsmart.jwt.exception.TokenRefreshException;
import com.bovsmart.jwt.model.RefreshToken;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.repository.UserRepository;
import com.bovsmart.jwt.security.jwt.JwtUtils;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.AuthService;
import com.bovsmart.jwt.service.RefreshTokenService;
import com.bovsmart.jwt.service.AuditLogService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

        private final AuthenticationManager authenticationManager;
        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtils jwtUtils;
        private final RefreshTokenService refreshTokenService;
        private final JavaMailSender mailSender;
        private final AuditLogService auditLogService;

        // Lưu OTP tạm thời trong RAM
        private final Map<String, String> resetCodes = new ConcurrentHashMap<>();

        private final Map<String, Instant> resetCodeExpiry = new ConcurrentHashMap<>();

        private final SecureRandom secureRandom = new SecureRandom();

        @Autowired
        public AuthServiceImpl(
                        AuthenticationManager authenticationManager,
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder,
                        JwtUtils jwtUtils,
                        RefreshTokenService refreshTokenService,
                        JavaMailSender mailSender,
                        AuditLogService auditLogService) {

                this.authenticationManager = authenticationManager;
                this.userRepository = userRepository;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtils = jwtUtils;
                this.refreshTokenService = refreshTokenService;
                this.mailSender = mailSender;
                this.auditLogService = auditLogService;
        }

        // ==================== LOGIN ====================

        @Override
        public JwtResponse login(LoginRequest loginRequest) {

                // 1. Kiểm tra dữ liệu đăng nhập
                if (loginRequest == null
                                || loginRequest.getEmail() == null
                                || loginRequest.getEmail().trim().isEmpty()
                                || loginRequest.getPassword() == null
                                || loginRequest.getPassword().trim().isEmpty()) {

                        throw new AppException("Vui lòng nhập email và mật khẩu!");
                }

                // 2. Chuẩn hóa email
                String email = loginRequest.getEmail().trim().toLowerCase();

                // 3. Tìm tài khoản theo email
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException("Email hoặc mật khẩu không chính xác!"));

                // 4. Kiểm tra tài khoản
                if (!user.isEnabled()) {
                        throw new AppException("Tài khoản đã bị khóa hoặc vô hiệu hóa!");
                }

                // 5. Xác thực bằng username nội bộ
                Authentication authentication;

                try {
                        authentication = authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        user.getUsername(),
                                                        loginRequest.getPassword()));

                } catch (BadCredentialsException e) {
                        throw new AppException("Email hoặc mật khẩu không chính xác!");
                }

                // 6. Đăng nhập thành công: reset số lần đăng nhập sai
                user.setFailedLoginAttempts(0);
                user.setLockUntil(null);
                userRepository.save(user);

                // 7. Lưu authentication
                SecurityContextHolder.getContext()
                                .setAuthentication(authentication);
                
                // Ghi nhật ký đăng nhập thành công
                writeAccountAuditLog(
                        "LOGIN_SUCCESS",
                        user,
                        "Đăng nhập thành công: " + user.getEmail(),
                        Map.of(
                                "email", user.getEmail()
                        )
                );

                // 8. Tạo Access Token
                String jwt = jwtUtils.generateJwtToken(authentication);

                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

                // 9. Lấy danh sách quyền
                List<String> roles = userDetails.getAuthorities()
                                .stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.toList());

                // 10. Tạo Refresh Token
                RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

                // 11. Trả về kết quả đăng nhập
                return new JwtResponse(
                        jwt,
                        refreshToken.getToken(),
                        userDetails.getId(),
                        userDetails.getUsername(),
                        userDetails.getEmail(),
                        roles,
                        user.getAvatar(),
                        user.getFullName(),
                        user.getPhone(),
                        user.getDepartment(),
                        user.getAssignedBarns() == null
                                ? List.of()
                                : List.copyOf(user.getAssignedBarns()));
        }

        // ==================== REGISTER ====================

        @Override
        public String register(RegisterRequest registerRequest) {

                if (registerRequest == null) {
                        throw new AppException("Thông tin đăng ký không hợp lệ!");
                }

                String username = registerRequest.getUsername();

                if (username == null || username.trim().isEmpty()) {
                        throw new AppException("Tên đăng nhập không được để trống!");
                }

                username = username.trim();

                String email = normalizeEmail(registerRequest.getEmail());

                if (userRepository.existsByUsername(username)) {
                        throw new AppException(
                                        "Lỗi: Tên đăng nhập đã được sử dụng!");
                }

                if (userRepository.existsByEmail(email)) {
                        throw new AppException(
                                        "Lỗi: Địa chỉ email đã được sử dụng!");
                }

                User user = new User(
                                username,
                                email,
                                passwordEncoder.encode(registerRequest.getPassword()));

               // Tài khoản đăng ký mặc định chỉ được cấp quyền STAFF.
               // Không nhận quyền từ dữ liệu người dùng gửi lên.
                Set<String> roles = new HashSet<>();
                roles.add("ROLE_STAFF");

                user.setRoles(roles);

                userRepository.save(user);

                return user.getUsername();
        }

        // ==================== REFRESH TOKEN ====================

        @Override
        public TokenRefreshResponse refreshToken(
                        String requestRefreshToken) {

                return refreshTokenService
                                .findByToken(requestRefreshToken)
                                .map(refreshTokenService::verifyExpiration)
                                .map(RefreshToken::getUser)
                                .map(user -> {

                                        String newAccessToken = jwtUtils.generateTokenFromUsername(
                                                        user.getUsername());

                                        return new TokenRefreshResponse(
                                                        newAccessToken,
                                                        requestRefreshToken);
                                })
                                .orElseThrow(() -> new TokenRefreshException(
                                                requestRefreshToken,
                                                "Refresh Token không tồn tại hoặc đã bị thu hồi!"));
        }

        // ==================== LOGOUT ====================

        @Override
        public void logout(String userId) {

                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new AppException("Không tìm thấy tài khoản"));

                refreshTokenService.deleteByUserId(userId);

                writeAccountAuditLog(
                        "LOGOUT",
                        user,
                        "Đăng xuất tài khoản: " + user.getEmail(),
                        Map.of(
                                "email", user.getEmail()
                        )
                );
        }

        // ==================== FORGOT PASSWORD ====================

        @Override
        public void forgotPassword(String email) {

                email = normalizeEmail(email);

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException("Email không tồn tại!"));

                // Tạo OTP 6 chữ số
                String code = String.format(
                                "%06d",
                                secureRandom.nextInt(1000000));

                // Lưu OTP trong 10 phút
                resetCodes.put(email, code);

                resetCodeExpiry.put(
                                email,
                                Instant.now().plusSeconds(600));

                try {
                        SimpleMailMessage message = new SimpleMailMessage();

                        message.setTo(user.getEmail());

                        message.setSubject(
                                        "BovSmart - Mã xác nhận đặt lại mật khẩu");

                        message.setText(
                                        "Xin chào " + user.getUsername()
                                                        + ",\n\n"
                                                        + "Mã xác nhận đặt lại mật khẩu của bạn là: "
                                                        + code
                                                        + "\n\n"
                                                        + "Mã có hiệu lực trong 10 phút."
                                                        + "\n\n"
                                                        + "Nếu bạn không yêu cầu đặt lại mật khẩu, "
                                                        + "hãy bỏ qua email này.");

                        mailSender.send(message);

                } catch (Exception e) {

                        resetCodes.remove(email);
                        resetCodeExpiry.remove(email);

                        throw new AppException(
                                        "Không thể gửi email. Vui lòng thử lại!");
                }
        }

        // ==================== VERIFY OTP ====================

        @Override
        public void verifyResetCode(String email, String code) {

                email = normalizeEmail(email);

                if (code == null || code.trim().isEmpty()) {
                        throw new AppException("Mã xác nhận không được để trống!");
                }

                code = code.trim();

                String savedCode = resetCodes.get(email);
                Instant expiry = resetCodeExpiry.get(email);

                if (savedCode == null || expiry == null) {
                        throw new AppException("Mã xác nhận không tồn tại!");
                }

                if (Instant.now().isAfter(expiry)) {
                        resetCodes.remove(email);
                        resetCodeExpiry.remove(email);

                        throw new AppException("Mã xác nhận đã hết hạn!");
                }

                if (!savedCode.equals(code)) {
                        throw new AppException("Mã xác nhận không chính xác!");
                }
        }

        // ==================== RESET PASSWORD ====================

        @Override
        public void resetPassword(
                        String email,
                        String code,
                        String newPassword) {

                // Chuẩn hóa email trước khi truy vấn MongoDB
                email = normalizeEmail(email);

                // Kiểm tra OTP
                verifyResetCode(email, code);

                if (newPassword == null || newPassword.length() < 6) {
                        throw new AppException(
                                        "Mật khẩu mới phải có ít nhất 6 ký tự!");
                }

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new AppException("Email không tồn tại!"));

                // Mã hóa mật khẩu mới
                user.setPassword(
                        passwordEncoder.encode(newPassword));

                User savedUser = userRepository.save(user);

                writeAccountAuditLog(
                        "PASSWORD_CHANGED",
                        savedUser,
                        "Người dùng tự thay đổi mật khẩu tài khoản: " + savedUser.getEmail(),
                        Map.of(
                                "email", savedUser.getEmail()
                        )
                );
                // Xóa OTP sau khi đổi mật khẩu thành công
                resetCodes.remove(email);
                resetCodeExpiry.remove(email);
        }

        // ==================== NORMALIZE EMAIL ====================

        private String normalizeEmail(String email) {

                if (email == null || email.trim().isEmpty()) {
                        throw new AppException("Email không được để trống!");
                }

                return email.trim().toLowerCase();
        }

        // ==================== GET PROFILE ====================

        @Override
        public User getProfile(String userId) {

                return userRepository.findById(userId)
                                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản"));
        }

        // ==================== UPDATE PROFILE ====================

        @Override
        public User updateProfile(
                        String userId,
                        String username,
                        String email,
                        String avatar,
                        String fullName,
                        String phone,
                        String department) {

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản"));

                // 1. Kiểm tra dữ liệu đầu vào
                if (username == null || username.trim().isEmpty()) {
                        throw new AppException(
                                        "Tên đăng nhập không được để trống");
                }

                if (email == null || email.trim().isEmpty()) {
                        throw new AppException("Email không được để trống");
                }

                if (fullName == null || fullName.trim().isEmpty()) {
                        throw new AppException("Họ và tên không được để trống");
                }

                // 2. Chuẩn hóa dữ liệu
                username = username.trim();
                email = normalizeEmail(email);
                fullName = fullName.trim();

                phone = phone == null ? null : phone.trim();

                // 3. Kiểm tra username trùng
                if (!username.equals(user.getUsername())
                                && userRepository.existsByUsername(username)) {

                        throw new AppException("Tên đăng nhập đã tồn tại");
                }

                // 4. Kiểm tra email trùng
                if (user.getEmail() == null
                                || !user.getEmail().equalsIgnoreCase(email)) {

                        if (userRepository.existsByEmail(email)) {
                                throw new AppException("Email đã tồn tại");
                        }
                }

                // 5. Chỉ cập nhật avatar khi có ảnh MinIO mới
                if (avatar != null && !avatar.trim().isEmpty()) {

                        avatar = avatar.trim();

                        if (!avatar.startsWith("minio:")
                                        || avatar.length() <= "minio:".length()) {

                                throw new AppException(
                                                "Mã ảnh đại diện MinIO không hợp lệ");
                        }

                        user.setAvatar(avatar);
                }

                // Nếu avatar null hoặc rỗng thì giữ nguyên avatar cũ

                // 6. Cập nhật thông tin tài khoản
                user.setUsername(username);
                user.setEmail(email);

                // 7. Cập nhật thông tin nhân sự
                user.setFullName(fullName);
                user.setPhone(phone);

                // 8. Lưu MongoDB
                return userRepository.save(user);
        }

        // ==================== CHANGE PASSWORD ====================

        @Override
        public void changePassword(
                        String userId,
                        String currentPassword,
                        String newPassword,
                        String confirmPassword) {

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản"));

                if (currentPassword == null || currentPassword.isEmpty()) {
                        throw new AppException(
                                        "Vui lòng nhập mật khẩu hiện tại");
                }

                if (newPassword == null || newPassword.length() < 6) {
                        throw new AppException(
                                        "Mật khẩu mới phải có ít nhất 6 ký tự");
                }

                if (confirmPassword == null
                                || !newPassword.equals(confirmPassword)) {

                        throw new AppException(
                                        "Mật khẩu xác nhận không khớp");
                }

                // Kiểm tra mật khẩu hiện tại
                if (!passwordEncoder.matches(
                                currentPassword,
                                user.getPassword())) {

                        throw new AppException(
                                        "Mật khẩu hiện tại không chính xác");
                }

                // Không cho dùng lại mật khẩu cũ
                if (passwordEncoder.matches(
                                newPassword,
                                user.getPassword())) {

                        throw new AppException(
                                        "Mật khẩu mới phải khác mật khẩu hiện tại");
                }

                user.setPassword(
                        passwordEncoder.encode(newPassword));

                User savedUser = userRepository.save(user);

                // Ghi nhật ký đặt lại mật khẩu
                writeAccountAuditLog(
                        "PASSWORD_RESET",
                        savedUser,
                        "Đặt lại mật khẩu bằng OTP: " + savedUser.getEmail(),
                        Map.of(
                                "email", savedUser.getEmail()
                        )
                );
        }

        // ==================== DANH SÁCH TÀI KHOẢN ====================

        @Override
        public List<User> getAllAccounts() {
                return userRepository.findAll();
        }

        // ==================== TẠO TÀI KHOẢN ====================

        @Override
        public User createAccount(CreateAccountRequest request) {

                // 1. Kiểm tra request
                if (request == null) {
                        throw new AppException(
                                        "Thông tin nhân sự không được để trống");
                }

                // 2. Kiểm tra họ tên
                if (request.getFullName() == null
                                || request.getFullName().trim().isEmpty()) {

                        throw new AppException(
                                        "Họ và tên không được để trống");
                }

                // 3. Kiểm tra username
                String username = request.getUsername();

                if (username == null || username.trim().isEmpty()) {
                        throw new AppException(
                                        "Tên đăng nhập không được để trống");
                }

                username = username.trim();

                if (userRepository.existsByUsername(username)) {
                        throw new AppException(
                                        "Tên đăng nhập đã tồn tại");
                }

                // 4. Kiểm tra email
                String email = normalizeEmail(request.getEmail());

                if (userRepository.existsByEmail(email)) {
                        throw new AppException("Email đã tồn tại");
                }

                // 5. Kiểm tra vai trò
                String role = request.getRole();

                if (role == null || role.trim().isEmpty()) {
                        throw new AppException("Vui lòng chọn vai trò");
                }

                role = role.trim().toUpperCase()
                                .replace("ROLE_", "");

                if (!Set.of(
                                "ADMIN",
                                "FARM_MANAGER",
                                "STAFF").contains(role)) {

                        throw new AppException("Vai trò không hợp lệ");
                }

                // 6. Kiểm tra mật khẩu
                if (request.getPassword() == null
                                || request.getPassword().length() < 6) {

                        throw new AppException(
                                        "Mật khẩu phải có ít nhất 6 ký tự");
                }

                // 7. Tạo tài khoản
                User user = new User();

                user.setUsername(username);
                user.setEmail(email);
                user.setFullName(request.getFullName().trim());
                user.setPhone(request.getPhone());
                user.setDepartment(request.getDepartment());

                // 8. Lưu avatar MinIO nếu có
                if (request.getAvatar() != null
                                && !request.getAvatar().trim().isEmpty()) {

                        String avatar = request.getAvatar().trim();

                        if (!avatar.startsWith("minio:")
                                        || avatar.length() <= "minio:".length()) {

                                throw new AppException(
                                                "Mã ảnh đại diện MinIO không hợp lệ");
                        }

                        user.setAvatar(avatar);
                }

                // 9. Phân quyền
                user.setRoles(Set.of("ROLE_" + role));

                // 10. Chuồng phụ trách
                user.setAssignedBarns(
                                request.getAssignedBarns() == null
                                                ? new HashSet<>()
                                                : new HashSet<>(request.getAssignedBarns()));

                // 11. Trạng thái tài khoản
                user.setEnabled(request.isEnabled());

                // 12. Mã hóa mật khẩu BCrypt
                user.setPassword(
                                passwordEncoder.encode(request.getPassword()));

                // 13. Lưu MongoDB
                User savedUser = userRepository.save(user);

                writeAccountAuditLog(
                                "ACCOUNT_CREATED",
                                savedUser,
                                "Tạo tài khoản nhân sự: " + savedUser.getEmail(),
                                Map.of(
                                                "email", savedUser.getEmail(),
                                                "role", role,
                                                "enabled", savedUser.isEnabled()));

                return savedUser;
        }

        // ==================== CẬP NHẬT TÀI KHOẢN ====================

        @Override
        public User updateAccount(
                        String userId,
                        CreateAccountRequest request) {

                // 1. Kiểm tra request
                if (request == null) {
                        throw new AppException(
                                        "Thông tin nhân sự không được để trống");
                }

                // 2. Tìm tài khoản
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException(
                                                "Không tìm thấy tài khoản"));

                Set<String> oldRoles = new HashSet<>(user.getRoles());

                // 3. Kiểm tra họ tên
                if (request.getFullName() == null
                                || request.getFullName().trim().isEmpty()) {

                        throw new AppException(
                                        "Họ và tên không được để trống");
                }

                // 4. Kiểm tra username
                String username = request.getUsername();

                if (username == null || username.trim().isEmpty()) {
                        throw new AppException(
                                        "Tên đăng nhập không được để trống");
                }

                username = username.trim();

                if (!username.equals(user.getUsername())
                                && userRepository.existsByUsername(username)) {

                        throw new AppException(
                                        "Tên đăng nhập đã tồn tại");
                }

                // 5. Chuẩn hóa email
                String email = normalizeEmail(request.getEmail());

                // 6. Kiểm tra email trùng
                if (user.getEmail() == null
                                || !user.getEmail().equalsIgnoreCase(email)) {

                        if (userRepository.existsByEmail(email)) {
                                throw new AppException("Email đã tồn tại");
                        }
                }

                // 7. Kiểm tra vai trò
                String role = request.getRole();

                if (role == null || role.trim().isEmpty()) {
                        throw new AppException("Vui lòng chọn vai trò");
                }

                role = role.trim().toUpperCase()
                                .replace("ROLE_", "");

                if (!Set.of(
                                "ADMIN",
                                "FARM_MANAGER",
                                "STAFF").contains(role)) {

                        throw new AppException("Vai trò không hợp lệ");
                }

                // 8. Cập nhật thông tin nhân sự
                user.setUsername(username);
                user.setFullName(request.getFullName().trim());
                user.setEmail(email);
                user.setPhone(request.getPhone());
                user.setDepartment(request.getDepartment());

                // 9. Chỉ cập nhật avatar nếu có ảnh mới
                if (request.getAvatar() != null
                                && !request.getAvatar().trim().isEmpty()) {

                        String avatar = request.getAvatar().trim();

                        if (!avatar.startsWith("minio:")
                                        || avatar.length() <= "minio:".length()) {

                                throw new AppException(
                                                "Mã ảnh đại diện MinIO không hợp lệ");
                        }

                        user.setAvatar(avatar);
                }

                // 10. Cập nhật vai trò
                user.setRoles(Set.of("ROLE_" + role));

                // 11. Cập nhật chuồng phụ trách
                user.setAssignedBarns(
                                request.getAssignedBarns() == null
                                                ? new HashSet<>()
                                                : new HashSet<>(request.getAssignedBarns()));

                // 12. Cập nhật trạng thái
                user.setEnabled(request.isEnabled());

                // Không thay đổi mật khẩu tại đây

                // 13. Lưu MongoDB
                User savedUser = userRepository.save(user);

                writeAccountAuditLog(
                                "ACCOUNT_UPDATED",
                                savedUser,
                                "Cập nhật thông tin tài khoản: " + savedUser.getEmail(),
                                Map.of(
                                                "email", savedUser.getEmail(),
                                                "enabled", savedUser.isEnabled()));

                if (!oldRoles.equals(savedUser.getRoles())) {
                        writeAccountAuditLog(
                                        "ROLE_CHANGED",
                                        savedUser,
                                        "Thay đổi vai trò tài khoản: " + savedUser.getEmail(),
                                        Map.of(
                                                        "oldRoles", oldRoles,
                                                        "newRoles", savedUser.getRoles()));
                }

                return savedUser;
        }

        // ==================== KHÓA TÀI KHOẢN ====================

        @Override
        public void lockAccount(String userId) {

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản"));

                if (!user.isEnabled()) {
                        throw new AppException("Tài khoản đã bị khóa!");
                }

                user.setEnabled(false);

                User savedUser = userRepository.save(user);

                writeAccountAuditLog(
                                "ACCOUNT_LOCKED",
                                savedUser,
                                "Khóa tài khoản: " + savedUser.getEmail(),
                                Map.of("email", savedUser.getEmail()));
        }

        // ==================== MỞ KHÓA TÀI KHOẢN ====================

        @Override
        public void unlockAccount(String userId) {

                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản"));

                if (user.isEnabled()) {
                        throw new AppException("Tài khoản đang hoạt động!");
                }

                user.setEnabled(true);
                user.setFailedLoginAttempts(0);
                user.setLockUntil(null);

                User savedUser = userRepository.save(user);

                writeAccountAuditLog(
                                "ACCOUNT_UNLOCKED",
                                savedUser,
                                "Mở khóa tài khoản: " + savedUser.getEmail(),
                                Map.of("email", savedUser.getEmail()));
        }

        // ==================== GHI NHẬT KÝ HỆ THỐNG ====================

        private void writeAccountAuditLog(
                        String action,
                        User targetUser,
                        String description,
                        Map<String, Object> details) {

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                String actorUsername = "SYSTEM";
                String actorRole = "SYSTEM";

                if (authentication != null
                                && authentication.isAuthenticated()
                                && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {

                        actorUsername = userDetails.getUsername();

                        actorRole = userDetails.getAuthorities()
                                        .stream()
                                        .map(GrantedAuthority::getAuthority)
                                        .findFirst()
                                        .orElse("UNKNOWN");
                }

                auditLogService.createLog(
                                actorUsername,
                                actorRole,
                                action,
                                "ACCOUNT",
                                targetUser.getId(),
                                description,
                                details);
        }

}
