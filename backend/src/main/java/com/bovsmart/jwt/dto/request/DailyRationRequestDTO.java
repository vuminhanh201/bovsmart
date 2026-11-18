
package com.bovsmart.jwt.dto.request;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DailyRationRequestDTO {

    private String groupCode;
    private String periodType;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<FeedItemDTO> feeds = new ArrayList<>();

    public static class FeedItemDTO {

        private String feedId;
        private double dailyQuantityPerHead;

        public String getFeedId() {
            return feedId;
        }

        public void setFeedId(String feedId) {
            this.feedId = feedId;
        }

        public double getDailyQuantityPerHead() {
            return dailyQuantityPerHead;
        }

        public void setDailyQuantityPerHead(double dailyQuantityPerHead) {
            this.dailyQuantityPerHead = dailyQuantityPerHead;
        }
    }

    public String getGroupCode() {
        return groupCode;
    }

    public void setGroupCode(String groupCode) {
        this.groupCode = groupCode;
    }

    public String getPeriodType() {
        return periodType;
    }

    public void setPeriodType(String periodType) {
        this.periodType = periodType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public List<FeedItemDTO> getFeeds() {
        return feeds;
    }

    public void setFeeds(List<FeedItemDTO> feeds) {
        this.feeds = feeds;
    }
}
