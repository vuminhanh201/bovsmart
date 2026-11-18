
package com.bovsmart.jwt.dto.request;

import java.util.List;

public class FeedingShiftRecordRequestDTO {

    private String shiftScheduleId;
    private String note;

    private List<FeedActualItemDTO> feeds;

    public String getShiftScheduleId() {
        return shiftScheduleId;
    }

    public void setShiftScheduleId(String shiftScheduleId) {
        this.shiftScheduleId = shiftScheduleId;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public List<FeedActualItemDTO> getFeeds() {
        return feeds;
    }

    public void setFeeds(List<FeedActualItemDTO> feeds) {
        this.feeds = feeds;
    }

    public static class FeedActualItemDTO {

        private String feedId;
        private double actualQuantity;

        public String getFeedId() {
            return feedId;
        }

        public void setFeedId(String feedId) {
            this.feedId = feedId;
        }

        public double getActualQuantity() {
            return actualQuantity;
        }

        public void setActualQuantity(double actualQuantity) {
            this.actualQuantity = actualQuantity;
        }
    }
}
