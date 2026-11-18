package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "verification_codes")
public class VerificationCode {

    @Id
    private String id;

    @Indexed
    private String code;

    @Indexed
    private String email;

    private String userId;

    // MongoDB TTL Index: tự động xóa document khi tới thời điểm expiryDate
    @Indexed(expireAfterSeconds = 0)
    private Instant expiryDate;

    private boolean verified = false;

    // "PASSWORD_RESET" hoặc "REGISTRATION"
    @Indexed
    private String type = "PASSWORD_RESET";

    private Instant createdAt = Instant.now();

    public VerificationCode() {
    }

    public VerificationCode(String code, String email, String userId, Instant expiryDate, String type) {
        this.code = code;
        this.email = email;
        this.userId = userId;
        this.expiryDate = expiryDate;
        this.verified = false;
        this.type = type != null ? type : "PASSWORD_RESET";
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Instant getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(Instant expiryDate) {
        this.expiryDate = expiryDate;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

