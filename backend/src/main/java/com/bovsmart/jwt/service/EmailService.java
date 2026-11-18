package com.bovsmart.jwt.service;

public interface EmailService {

    void sendPasswordResetOtpEmail(String toEmail, String username, String code);
}

