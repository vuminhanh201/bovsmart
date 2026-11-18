package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "cattle_transfers")
public class CattleTransfer {

    @Id
    private String id;

    private String cattleId;
    private String cattleName;
    private String rfidTag;

    private String fromBarnCode;
    private String toBarnCode;

    private String transferredBy;
    private String transferredAt;
    private String note;

    public CattleTransfer() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getCattleName() {
        return cattleName;
    }

    public void setCattleName(String cattleName) {
        this.cattleName = cattleName;
    }

    public String getRfidTag() {
        return rfidTag;
    }

    public void setRfidTag(String rfidTag) {
        this.rfidTag = rfidTag;
    }

    public String getFromBarnCode() {
        return fromBarnCode;
    }

    public void setFromBarnCode(String fromBarnCode) {
        this.fromBarnCode = fromBarnCode;
    }

    public String getToBarnCode() {
        return toBarnCode;
    }

    public void setToBarnCode(String toBarnCode) {
        this.toBarnCode = toBarnCode;
    }

    public String getTransferredBy() {
        return transferredBy;
    }

    public void setTransferredBy(String transferredBy) {
        this.transferredBy = transferredBy;
    }

    public String getTransferredAt() {
        return transferredAt;
    }

    public void setTransferredAt(String transferredAt) {
        this.transferredAt = transferredAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}