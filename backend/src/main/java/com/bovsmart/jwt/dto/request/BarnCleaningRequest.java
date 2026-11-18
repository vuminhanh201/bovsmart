package com.bovsmart.jwt.dto.request;

public class BarnCleaningRequest {

    private String cleaningDate;
    private String cleaningType;
    private String description;

    public BarnCleaningRequest() {
    }

    public String getCleaningDate() {
        return cleaningDate;
    }

    public void setCleaningDate(String cleaningDate) {
        this.cleaningDate = cleaningDate;
    }

    public String getCleaningType() {
        return cleaningType;
    }

    public void setCleaningType(String cleaningType) {
        this.cleaningType = cleaningType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}