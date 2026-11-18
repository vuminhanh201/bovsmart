package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "barn_capacity_checks")
public class BarnCapacityCheck {

    @Id
    private String id;

    private String barnCode;
    private String barnName;
    private int capacity;
    private long currentCount;
    private int availableSlots;
    private boolean overCapacity;

    private String checkedBy;
    private String checkedAt;
    private boolean confirmed;

    public BarnCapacityCheck() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBarnCode() {
        return barnCode;
    }

    public void setBarnCode(String barnCode) {
        this.barnCode = barnCode;
    }

    public String getBarnName() {
        return barnName;
    }

    public void setBarnName(String barnName) {
        this.barnName = barnName;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public long getCurrentCount() {
        return currentCount;
    }

    public void setCurrentCount(long currentCount) {
        this.currentCount = currentCount;
    }

    public int getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(int availableSlots) {
        this.availableSlots = availableSlots;
    }

    public boolean isOverCapacity() {
        return overCapacity;
    }

    public void setOverCapacity(boolean overCapacity) {
        this.overCapacity = overCapacity;
    }

    public String getCheckedBy() {
        return checkedBy;
    }

    public void setCheckedBy(String checkedBy) {
        this.checkedBy = checkedBy;
    }

    public String getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(String checkedAt) {
        this.checkedAt = checkedAt;
    }

    public boolean isConfirmed() {
        return confirmed;
    }

    public void setConfirmed(boolean confirmed) {
        this.confirmed = confirmed;
    }
}