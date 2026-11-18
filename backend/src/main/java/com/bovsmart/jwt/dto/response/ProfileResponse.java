
package com.bovsmart.jwt.dto.response;

import java.time.Instant;
import java.util.Set;

public class ProfileResponse {

    private String id;
    private String username;
    private String email;
    private Set<String> roles;
    private Instant createdAt;
    private String avatar;
    private String fullName;
    private String phone;
    private String department;

    public ProfileResponse() {
    }

    public ProfileResponse(
            String id,
            String username,
            String email,
            Set<String> roles,
            Instant createdAt,
            String avatar,
            String fullName,
            String phone,
            String department) {

        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.createdAt = createdAt;
        this.avatar = avatar;
        this.fullName = fullName;
        this.phone = phone;
        this.department = department;
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getEmail() {
        return email;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getAvatar() {
        return avatar;
    }

    public String getFullName() {
        return fullName;
    }

    public String getPhone() {
        return phone;
    }

    public String getDepartment() {
        return department;
    }
}
