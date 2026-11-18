
package com.bovsmart.jwt.dto.response;

import java.util.List;

public class JwtResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String id;
    private String username;
    private String email;
    private List<String> roles;
    private String avatar;
    private String fullName;
    private String phone;
    private String department;
    private List<String> assignedBarns;

    public JwtResponse() {
    }

    public JwtResponse(
            String accessToken,
            String refreshToken,
            String id,
            String username,
            String email,
            List<String> roles,
            String avatar,
            String fullName,
            String phone,
            String department,
            List<String> assignedBarns){

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = "Bearer";
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.avatar = avatar;
        this.fullName = fullName;
        this.phone = phone;
        this.department = department;
        this.assignedBarns = assignedBarns;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public List<String> getAssignedBarns() {
        return assignedBarns;
    }

    public void setAssignedBarns(List<String> assignedBarns) {
        this.assignedBarns = assignedBarns;
    }
}
