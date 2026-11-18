package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "barn_cleaning_logs")
public class BarnCleaningLog {

    @Id
    private String id;

    private String barnCode;
    private String barnName;

    private String cleaningDate;
    private String cleaningType;
    private String description;

    private String cleanedBy;
    private String createdAt;

    public BarnCleaningLog() {
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

    public String getCleanedBy() {
        return cleanedBy;
    }

    public void setCleanedBy(String cleanedBy) {
        this.cleanedBy = cleanedBy;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}