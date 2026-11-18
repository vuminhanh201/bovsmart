
package com.bovsmart.jwt.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "feeding_shift_records")
public class FeedingShiftRecord {

    @Id
    private String id;

    private String shiftScheduleId;
    private String dailyRationId;

    private String scheduleCode;

    private String barnId;
    private String barnCode;

    private LocalDate feedingDate;

    private String shiftCode;
    private String shiftName;

    private String performedBy;
    private String note;

    private List<FeedActualItem> feeds;

    private String recordStatus;

    private String reviewedBy;
    private String reviewNote;
    private LocalDateTime reviewedAt;

    private LocalDateTime performedAt;

    public FeedingShiftRecord() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getShiftScheduleId() {
        return shiftScheduleId;
    }

    public void setShiftScheduleId(String shiftScheduleId) {
        this.shiftScheduleId = shiftScheduleId;
    }

    public String getDailyRationId() {
        return dailyRationId;
    }

    public void setDailyRationId(String dailyRationId) {
        this.dailyRationId = dailyRationId;
    }

    public String getScheduleCode() {
        return scheduleCode;
    }

    public void setScheduleCode(String scheduleCode) {
        this.scheduleCode = scheduleCode;
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

    public LocalDate getFeedingDate() {
        return feedingDate;
    }

    public void setFeedingDate(LocalDate feedingDate) {
        this.feedingDate = feedingDate;
    }

    public String getShiftCode() {
        return shiftCode;
    }

    public void setShiftCode(String shiftCode) {
        this.shiftCode = shiftCode;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public List<FeedActualItem> getFeeds() {
        return feeds;
    }

    public void setFeeds(List<FeedActualItem> feeds) {
        this.feeds = feeds;
    }

    public String getRecordStatus() {
        return recordStatus;
    }

    public void setRecordStatus(String recordStatus) {
        this.recordStatus = recordStatus;
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

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }

    public static class FeedActualItem {

        private String feedId;
        private String feedName;

        private double plannedQuantity;
        private double actualQuantity;

        private String unit;

        public FeedActualItem() {
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

        public double getActualQuantity() {
            return actualQuantity;
        }

        public void setActualQuantity(double actualQuantity) {
            this.actualQuantity = actualQuantity;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }
    }
}
