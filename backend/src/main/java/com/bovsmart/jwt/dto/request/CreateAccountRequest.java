
package com.bovsmart.jwt.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public class CreateAccountRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    private String username;

    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    private String phone;

    @NotBlank(message = "Vui lòng chọn vai trò")
    private String role;

    @NotBlank(message = "Phòng ban không được để trống")
    private String department;

    private Set<String> assignedBarns;

    private boolean enabled = true;

    private String password;

    private String avatar;

    public CreateAccountRequest() {
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Set<String> getAssignedBarns() {
        return assignedBarns;
    }

    public void setAssignedBarns(Set<String> assignedBarns) {
        this.assignedBarns = assignedBarns;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }
}
