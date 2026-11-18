package com.bovsmart.jwt.dto.request;

import jakarta.validation.constraints.NotBlank;

public class SaleRequestReviewRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    private String rejectionReason;

    public SaleRequestReviewRequest() {
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}