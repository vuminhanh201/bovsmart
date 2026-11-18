package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "cattle_update_requests")
public class CattleUpdateRequest {

    @Id
    private String id;

    private String cattleId;

    // RFID hiện tại và RFID được đề xuất
    private String currentRfidTag;
    private String requestedRfidTag;

    // Trạng thái được đề xuất
    private String requestedStatus;

    // PENDING, APPROVED, REJECTED
    private String requestStatus = "PENDING";

    // Người gửi yêu cầu
    private String requestedBy;

    // Người kiểm tra
    private String reviewedBy;

    private String reviewNote;

    private Instant createdAt = Instant.now();
    private Instant reviewedAt;

    public CattleUpdateRequest() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getCurrentRfidTag() {
        return currentRfidTag;
    }

    public void setCurrentRfidTag(String currentRfidTag) {
        this.currentRfidTag = currentRfidTag;
    }

    public String getRequestedRfidTag() {
        return requestedRfidTag;
    }

    public void setRequestedRfidTag(String requestedRfidTag) {
        this.requestedRfidTag = requestedRfidTag;
    }

    public String getRequestedStatus() {
        return requestedStatus;
    }

    public void setRequestedStatus(String requestedStatus) {
        this.requestedStatus = requestedStatus;
    }

    public String getRequestStatus() {
        return requestStatus;
    }

    public void setRequestStatus(String requestStatus) {
        this.requestStatus = requestStatus;
    }

    public String getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(String requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
