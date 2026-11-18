package com.bovsmart.jwt.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "daily_rations")
public class DailyRation {

    @Id
    private String id;

    private String rationCode;
    private String barnId;
    private String barnCode;

    private LocalDate feedingDate;
    private int cattleCount;

    // Danh sách thức ăn trong khẩu phần một con trong cả ngày
    private List<RationFeedItem> feeds = new ArrayList<>();

    private String status;
    private String createdBy;
    private LocalDateTime createdAt;

    public DailyRation() {
    }

    public static class RationFeedItem {

        private String feedId;
        private String feedName;
        private double dailyQuantityPerHead;
        private String unit;

        public RationFeedItem() {
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

        public double getDailyQuantityPerHead() {
            return dailyQuantityPerHead;
        }

        public void setDailyQuantityPerHead(double dailyQuantityPerHead) {
            this.dailyQuantityPerHead = dailyQuantityPerHead;
        }

        public String getUnit() {
            return unit;
        }

        public void setUnit(String unit) {
            this.unit = unit;
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRationCode() {
        return rationCode;
    }

    public void setRationCode(String rationCode) {
        this.rationCode = rationCode;
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

    public int getCattleCount() {
        return cattleCount;
    }

    public void setCattleCount(int cattleCount) {
        this.cattleCount = cattleCount;
    }

    public List<RationFeedItem> getFeeds() {
        return feeds;
    }

    public void setFeeds(List<RationFeedItem> feeds) {
        this.feeds = feeds;
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