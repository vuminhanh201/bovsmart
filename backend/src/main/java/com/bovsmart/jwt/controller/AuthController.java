package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.LoginRequest;
import com.bovsmart.jwt.dto.request.RegisterRequest;
import com.bovsmart.jwt.dto.request.ResetPasswordRequest;
import com.bovsmart.jwt.dto.request.TokenRefreshRequest;
import com.bovsmart.jwt.dto.request.VerifyResetCodeRequest;
import com.bovsmart.jwt.dto.response.JwtResponse;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.dto.response.TokenRefreshResponse;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.AuthService;
import com.bovsmart.jwt.dto.request.ForgotPasswordRequest;
import com.bovsmart.jwt.dto.request.UpdateProfileRequest;
import com.bovsmart.jwt.dto.request.ChangePasswordRequest;
import com.bovsmart.jwt.dto.response.ProfileResponse;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.dto.request.CreateAccountRequest;
import com.bovsmart.jwt.dto.response.AccountResponse;

import jakarta.validation.Valid;
import java.util.List;
import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * API Đăng nhập — trả về 2 token: Access Token (ngắn hạn) và Refresh Token (dài hạn)
     */
    
   @PostMapping("/login")
        public ResponseEntity<ResponseModel<JwtResponse>> authenticateUser(
                @Valid @RequestBody LoginRequest loginRequest) {

        System.out.println("========== ĐÃ VÀO AUTH CONTROLLER LOGIN ==========");

        JwtResponse jwtResponse = authService.login(loginRequest);

        return ResponseEntity.ok(ResponseModel.success(
                jwtResponse,
                "Đăng nhập thành công!"
        ));
        }

    /**
     * API Cấp lại Access Token mới từ Refresh Token dài hạn
     */
    @PostMapping("/refreshtoken")
    public ResponseEntity<ResponseModel<TokenRefreshResponse>> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ResponseModel.success(
                response,
                "Làm mới Access Token thành công!"
        ));
    }

    /**
     * API Đăng xuất — Xóa TOÀN BỘ Refresh Token của người dùng khỏi MongoDB
     */
    @PostMapping("/logout")
    public ResponseEntity<ResponseModel<?>> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            authService.logout(userDetails.getId());
            return ResponseEntity.ok(ResponseModel.success(
                    null,
                    "Đăng xuất thành công! Toàn bộ phiên làm việc và Refresh Token đã được xóa."
            ));
        }

        return ResponseEntity.badRequest().body(ResponseModel.error(
                "Người dùng chưa được xác thực hoặc phiên làm việc không hợp lệ!"
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ResponseModel<?>> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request) {

    authService.forgotPassword(request.getEmail());

    return ResponseEntity.ok(ResponseModel.success(
            null,
            "Mã OTP đã được gửi đến email!"
    ));
}

@PostMapping("/verify-reset-code")
public ResponseEntity<ResponseModel<?>> verifyResetCode(
        @Valid @RequestBody VerifyResetCodeRequest request) {

    // Gọi AuthService để xác minh OTP thật
    authService.verifyResetCode(
            request.getEmail(),
            request.getCode()
    );

    return ResponseEntity.ok(ResponseModel.success(
            null,
            "Mã OTP hợp lệ!"
    ));
}

@PostMapping("/reset-password")
public ResponseEntity<ResponseModel<?>> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request) {

    authService.resetPassword(
            request.getEmail(),
            request.getCode(),
            request.getNewPassword()
    );

    return ResponseEntity.ok(ResponseModel.success(
            null,
            "Đặt lại mật khẩu thành công!"
    ));
}

// GET hồ sơ cá nhân
@GetMapping("/profile")
public ResponseModel<ProfileResponse> getProfile() {

    Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

    UserDetailsImpl userDetails =
            (UserDetailsImpl) authentication.getPrincipal();

    User user = authService.getProfile(userDetails.getId());

    ProfileResponse profile = new ProfileResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getRoles(),
        user.getCreatedAt(),
        user.getAvatar(),
        user.getFullName(),
        user.getPhone(),
        user.getDepartment()
    );

    return ResponseModel.success(
            profile,
            "Lấy hồ sơ cá nhân thành công"
    );
}

// PUT cập nhật hồ sơ cá nhân
@PutMapping("/profile")
public ResponseModel<ProfileResponse> updateProfile(
        @RequestBody UpdateProfileRequest request) {

    Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

    UserDetailsImpl userDetails =
            (UserDetailsImpl) authentication.getPrincipal();

    User user = authService.updateProfile(
        userDetails.getId(),
        request.getUsername(),
        request.getEmail(),
        request.getAvatar(),
        request.getFullName(),
        request.getPhone(),
        request.getDepartment()
    );

    ProfileResponse profile = new ProfileResponse(
        user.getId(),
        user.getUsername(),
        user.getEmail(),
        user.getRoles(),
        user.getCreatedAt(),
        user.getAvatar(),
        user.getFullName(),
        user.getPhone(),
        user.getDepartment()
    );

    return ResponseModel.success(
            profile,
            "Cập nhật hồ sơ thành công"
    );
}

// PUT đổi mật khẩu
@PutMapping("/change-password")
public ResponseModel<String> changePassword(
        @RequestBody ChangePasswordRequest request) {

    Authentication authentication =
            SecurityContextHolder.getContext().getAuthentication();

    UserDetailsImpl userDetails =
            (UserDetailsImpl) authentication.getPrincipal();

    authService.changePassword(
            userDetails.getId(),
            request.getCurrentPassword(),
            request.getNewPassword(),
            request.getConfirmPassword()
    );

    return ResponseModel.success(
            null,
            "Đổi mật khẩu thành công"
    );
}

// GET danh sách tất cả nhân viên STAFF đang hoạt động để quản lý phân công công việc
@GetMapping("/staff-options")
public ResponseModel<List<AccountResponse>> getStaffOptions(
        Authentication authentication) {

    boolean isFarmManager = authentication != null
            && authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FARM_MANAGER"));

    if (!isFarmManager) {
        throw new AccessDeniedException(
                "Chỉ quản lý trang trại mới được xem danh sách nhân viên!");
    }

    List<User> users = authService.getAllAccounts();

    List<AccountResponse> staffList = new ArrayList<>();

    for (User user : users) {

        boolean isStaff = user.getRoles() != null
                && user.getRoles().stream()
                        .anyMatch(role ->
                                role.equals("ROLE_STAFF")
                                || role.equals("STAFF"));

        // Chỉ lấy nhân viên STAFF đang hoạt động.
        // Không giới hạn theo phòng ban.
        if (!isStaff || !user.isEnabled()) {
            continue;
        }

        AccountResponse account = new AccountResponse();

        account.setId(user.getId());
        account.setUsername(user.getUsername());
        account.setFullName(user.getFullName());
        account.setEmail(user.getEmail());
        account.setPhone(user.getPhone());
        account.setRoles(user.getRoles());
        account.setDepartment(user.getDepartment());
        account.setAssignedBarns(user.getAssignedBarns());
        account.setEnabled(user.isEnabled());
        account.setAvatar(user.getAvatar());

        staffList.add(account);
    }

    return ResponseModel.success(
            staffList,
            "Lấy danh sách nhân viên đang hoạt động thành công!"
    );
}

// GET danh sách tài khoản
@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/accounts")
public ResponseModel<List<AccountResponse>> getAllAccounts() {

    List<User> users = authService.getAllAccounts();

    List<AccountResponse> accounts = new ArrayList<>();

    for (User user : users) {

        AccountResponse account = new AccountResponse();

        account.setId(user.getId());
        account.setUsername(user.getUsername());
        account.setFullName(user.getFullName());
        account.setEmail(user.getEmail());
        account.setPhone(user.getPhone());
        account.setRoles(user.getRoles());
        account.setDepartment(user.getDepartment());
        account.setAssignedBarns(user.getAssignedBarns());
        account.setEnabled(user.isEnabled());
        account.setAvatar(user.getAvatar());

        accounts.add(account);
    }

    return ResponseModel.success(
            accounts,
            "Lấy danh sách tài khoản thành công"
    );
}


// POST tạo tài khoản nhân sự
@PreAuthorize("hasRole('ADMIN')")
@PostMapping("/accounts")
public ResponseEntity<ResponseModel<?>> createAccount(
        @Valid @RequestBody CreateAccountRequest request) {

    User user = authService.createAccount(request);

    return ResponseEntity.ok(
            ResponseModel.success(
                    null,
                    "Tạo tài khoản [" + user.getEmail() + "] thành công!"
            )
    );
}

// PUT cập nhật tài khoản nhân sự
@PreAuthorize("hasRole('ADMIN')")
@PutMapping("/accounts/{userId}")
public ResponseEntity<ResponseModel<?>> updateAccount(
        @PathVariable String userId,
        @Valid @RequestBody CreateAccountRequest request) {

    User user = authService.updateAccount(userId, request);

    return ResponseEntity.ok(
            ResponseModel.success(
                    null,
                    "Cập nhật tài khoản [" + user.getEmail() + "] thành công!"
            )
    );
}

// PUT khóa tài khoản
@PreAuthorize("hasRole('ADMIN')")
@PutMapping("/accounts/{userId}/lock")
public ResponseEntity<ResponseModel<?>> lockAccount(
        @PathVariable String userId) {

    authService.lockAccount(userId);

    return ResponseEntity.ok(
            ResponseModel.success(
                    null,
                    "Khóa tài khoản thành công!"
            )
    );
}

// PUT mở khóa tài khoản
@PreAuthorize("hasRole('ADMIN')")
@PutMapping("/accounts/{userId}/unlock")
public ResponseEntity<ResponseModel<?>> unlockAccount(
        @PathVariable String userId) {

    authService.unlockAccount(userId);

    return ResponseEntity.ok(
            ResponseModel.success(
                    null,
                    "Mở khóa tài khoản thành công!"
            )
    );
}

}

