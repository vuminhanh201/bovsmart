package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.model.VerificationCode;

public interface VerificationService {

    VerificationCode generateAndSendPasswordResetCode(User user);

    void verifyResetCode(String email, String code);
}

