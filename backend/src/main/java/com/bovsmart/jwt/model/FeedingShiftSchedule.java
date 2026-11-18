package com.bovsmart.jwt.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "feeding_shift_schedules")
public class FeedingShiftSchedule {

    @Id
    private String id;

    private String dailyRationId;
    private String scheduleCode;

    private String barnId;
    private String barnCode;

    private LocalDate feedingDate;
    private String shiftCode;
    private String shiftName;
    private LocalTime feedingTime;
    private double ratio;

    private List<ShiftFeedItem> feeds = new ArrayList<>();

    private String assignedTo;
    private String status;

    private String createdBy;
    private LocalDateTime createdAt;

    public static class ShiftFeedItem {

        private String feedId;
        private String feedName;
        private double plannedQuantity;
        private String unit;

        public String getFeedId() { return feedId; }
        public void setFeedId(String feedId) { this.feedId = feedId; }

        public String getFeedName() { return feedName; }
        public void setFeedName(String feedName) { this.feedName = feedName; }

        public double getPlannedQuantity() { return plannedQuantity; }
        public void setPlannedQuantity(double plannedQuantity) {
            this.plannedQuantity = plannedQuantity;
        }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }

    public FeedingShiftSchedule() {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDailyRationId() { return dailyRationId; }
    public void setDailyRationId(String dailyRationId) {
        this.dailyRationId = dailyRationId;
    }

    public String getScheduleCode() { return scheduleCode; }
    public void setScheduleCode(String scheduleCode) {
        this.scheduleCode = scheduleCode;
    }

    public String getBarnId() { return barnId; }
    public void setBarnId(String barnId) { this.barnId = barnId; }

    public String getBarnCode() { return barnCode; }
    public void setBarnCode(String barnCode) { this.barnCode = barnCode; }

    public LocalDate getFeedingDate() { return feedingDate; }
    public void setFeedingDate(LocalDate feedingDate) {
        this.feedingDate = feedingDate;
    }

    public String getShiftCode() { return shiftCode; }
    public void setShiftCode(String shiftCode) { this.shiftCode = shiftCode; }

    public String getShiftName() { return shiftName; }
    public void setShiftName(String shiftName) { this.shiftName = shiftName; }

    public LocalTime getFeedingTime() { return feedingTime; }
    public void setFeedingTime(LocalTime feedingTime) {
        this.feedingTime = feedingTime;
    }

    public double getRatio() { return ratio; }
    public void setRatio(double ratio) { this.ratio = ratio; }

    public List<ShiftFeedItem> getFeeds() { return feeds; }
    public void setFeeds(List<ShiftFeedItem> feeds) { this.feeds = feeds; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}