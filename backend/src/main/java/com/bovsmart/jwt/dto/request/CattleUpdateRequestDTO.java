
package com.bovsmart.jwt.dto.request;

public class CattleUpdateRequestDTO {

    private String cattleId;
    private String requestedRfidTag;
    private String requestedStatus;

    public CattleUpdateRequestDTO() {
    }

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getRequestedRfidTag() {
        return requestedRfidTag;
    }

    public void setRequestedRfidTag(String requestedRfidTag) {
        this.requestedRfidTag = requestedRfidTag;
    }

    public String getRequestedStatus() {
        return requestedStatus;
    }

    public void setRequestedStatus(String requestedStatus) {
        this.requestedStatus = requestedStatus;
    }
}
