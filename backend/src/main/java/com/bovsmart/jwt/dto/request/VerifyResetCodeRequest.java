package com.bovsmart.jwt.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class VerifyResetCodeRequest {

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String email;

    @NotBlank(message = "Mã xác minh OTP không được để trống")
    @Size(min = 6, max = 6, message = "Mã xác minh phải có đúng 6 chữ số")
    @Pattern(regexp = "^[0-9]{6}$", message = "Mã xác minh phải là 6 chữ số")
    private String code;

    public VerifyResetCodeRequest() {
    }

    public VerifyResetCodeRequest(String email, String code) {
        this.email = email;
        this.code = code;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}

