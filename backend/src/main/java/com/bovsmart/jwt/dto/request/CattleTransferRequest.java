package com.bovsmart.jwt.dto.request;

public class CattleTransferRequest {

    private String toBarnCode;
    private String note;

    public CattleTransferRequest() {
    }

    public String getToBarnCode() {
        return toBarnCode;
    }

    public void setToBarnCode(String toBarnCode) {
        this.toBarnCode = toBarnCode;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}