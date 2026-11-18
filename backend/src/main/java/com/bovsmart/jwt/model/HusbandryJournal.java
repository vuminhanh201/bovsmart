
package com.bovsmart.jwt.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "husbandry_journals")
public class HusbandryJournal {

    @Id
    private String id;

    private String journalCode;

    private String cattleId;

    private String rfidTag;

    private String earTagNumber;

    private String barnId;

    private String barnName;

    private String workType;

    private String title;

    private String content;

    private LocalDateTime performedAt;

    private String performedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public HusbandryJournal() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getJournalCode() {
        return journalCode;
    }

    public void setJournalCode(String journalCode) {
        this.journalCode = journalCode;
    }

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getRfidTag() {
        return rfidTag;
    }

    public void setRfidTag(String rfidTag) {
        this.rfidTag = rfidTag;
    }

    public String getEarTagNumber() {
        return earTagNumber;
    }

    public void setEarTagNumber(String earTagNumber) {
        this.earTagNumber = earTagNumber;
    }

    public String getBarnId() {
        return barnId;
    }

    public void setBarnId(String barnId) {
        this.barnId = barnId;
    }

    public String getBarnName() {
        return barnName;
    }

    public void setBarnName(String barnName) {
        this.barnName = barnName;
    }

    public String getWorkType() {
        return workType;
    }

    public void setWorkType(String workType) {
        this.workType = workType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
