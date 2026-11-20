
package com.bovsmart.jwt.service;

public class ChatbotRateLimitException extends RuntimeException {

    public ChatbotRateLimitException(String message) {
        super(message);
    }
}
