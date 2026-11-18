package com.bovsmart.jwt.dto.request;

public class RfidScanRequest {

    private String rfidTag;

    public RfidScanRequest() {
    }

    public String getRfidTag() {
        return rfidTag;
    }

    public void setRfidTag(String rfidTag) {
        this.rfidTag = rfidTag;
    }
}