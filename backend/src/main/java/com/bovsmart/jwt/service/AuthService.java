package com.bovsmart.jwt.service;

import java.util.List;

import com.bovsmart.jwt.dto.request.CreateAccountRequest;
import com.bovsmart.jwt.dto.request.LoginRequest;
import com.bovsmart.jwt.dto.request.RegisterRequest;
import com.bovsmart.jwt.dto.response.JwtResponse;
import com.bovsmart.jwt.dto.response.TokenRefreshResponse;
import com.bovsmart.jwt.model.User;

public interface AuthService {

    JwtResponse login(LoginRequest loginRequest);

    String register(RegisterRequest registerRequest);

    TokenRefreshResponse refreshToken(String refreshToken);

    void logout(String userId);

    void forgotPassword(String email);

    void verifyResetCode(String email, String code);

    void resetPassword(String email, String code, String newPassword);

    User getProfile(String userId);

    User updateProfile(
            String userId,
            String username,
            String email,
            String avatar,
            String fullName,
            String phone,
            String department
    );

    void changePassword(
        String userId,
        String currentPassword,
        String newPassword,
        String confirmPassword
    );

    //Quản lý tài khoản
    List<User> getAllAccounts();

    User createAccount(CreateAccountRequest request);

    User updateAccount(String userId, CreateAccountRequest request);
    
    void lockAccount(String userId);

    void unlockAccount(String userId);
}
