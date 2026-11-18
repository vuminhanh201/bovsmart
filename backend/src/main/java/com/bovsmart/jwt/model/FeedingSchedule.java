
package com.bovsmart.jwt.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "feeding_schedules")
public class FeedingSchedule {

    @Id
    private String id;

    private String scheduleCode;
    private String feedId;
    private String feedName;
    private double plannedQuantity;
    private String unit;

    private String barnId;
    private String barnCode;

    private String assignedTo;
    private LocalDate feedingDate;
    private LocalTime feedingTime;

    private String note;
    private String status;

    private String createdBy;
    private LocalDateTime createdAt;

    public FeedingSchedule() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getScheduleCode() {
        return scheduleCode;
    }

    public void setScheduleCode(String scheduleCode) {
        this.scheduleCode = scheduleCode;
    }

    public String getFeedId() {
        return feedId;
    }

    public void setFeedId(String feedId) {
        this.feedId = feedId;
    }

    public String getFeedName() {
        return feedName;
    }

    public void setFeedName(String feedName) {
        this.feedName = feedName;
    }

    public double getPlannedQuantity() {
        return plannedQuantity;
    }

    public void setPlannedQuantity(double plannedQuantity) {
        this.plannedQuantity = plannedQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public String getBarnId() {
        return barnId;
    }

    public void setBarnId(String barnId) {
        this.barnId = barnId;
    }

    public String getBarnCode() {
        return barnCode;
    }

    public void setBarnCode(String barnCode) {
        this.barnCode = barnCode;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public LocalDate getFeedingDate() {
        return feedingDate;
    }

    public void setFeedingDate(LocalDate feedingDate) {
        this.feedingDate = feedingDate;
    }

    public LocalTime getFeedingTime() {
        return feedingTime;
    }

    public void setFeedingTime(LocalTime feedingTime) {
        this.feedingTime = feedingTime;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
