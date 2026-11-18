package com.bovsmart.jwt.exception;

public class TokenRefreshException extends RuntimeException {

    private final String token;

    public TokenRefreshException(String token, String message) {
        super(String.format("Lỗi Refresh Token [%s]: %s", token, message));
        this.token = token;
    }

    public String getToken() {
        return token;
    }
}

