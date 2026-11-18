
package com.bovsmart.jwt.dto.request;

import java.time.LocalDate;
import java.time.LocalTime;

public class FeedingScheduleRequestDTO {

    private String feedId;
    private double plannedQuantity;

    private String barnId;
    private String assignedTo;

    private LocalDate feedingDate;
    private LocalTime feedingTime;

    private String note;

    public FeedingScheduleRequestDTO() {
    }

    public String getFeedId() {
        return feedId;
    }

    public void setFeedId(String feedId) {
        this.feedId = feedId;
    }

    public double getPlannedQuantity() {
        return plannedQuantity;
    }

    public void setPlannedQuantity(double plannedQuantity) {
        this.plannedQuantity = plannedQuantity;
    }

    public String getBarnId() {
        return barnId;
    }

    public void setBarnId(String barnId) {
        this.barnId = barnId;
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
}
