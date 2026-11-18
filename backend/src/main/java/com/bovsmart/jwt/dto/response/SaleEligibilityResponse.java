
package com.bovsmart.jwt.dto.response;

public class SaleEligibilityResponse {

    private String cattleId;
    private String rfidTag;
    private String earTagNumber;
    private String cattleName;
    private String status;

    private double currentWeight;
    private double targetMarketWeight;

    private boolean statusEligible;
    private boolean weightEligible;
    private boolean withdrawalEligible;
    private boolean eligible;

    private String withdrawalEndDate;
    private String withdrawalStatus;
    private String message;

    public SaleEligibilityResponse() {
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

    public String getCattleName() {
        return cattleName;
    }

    public void setCattleName(String cattleName) {
        this.cattleName = cattleName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getCurrentWeight() {
        return currentWeight;
    }

    public void setCurrentWeight(double currentWeight) {
        this.currentWeight = currentWeight;
    }

    public double getTargetMarketWeight() {
        return targetMarketWeight;
    }

    public void setTargetMarketWeight(double targetMarketWeight) {
        this.targetMarketWeight = targetMarketWeight;
    }

    public boolean isStatusEligible() {
        return statusEligible;
    }

    public void setStatusEligible(boolean statusEligible) {
        this.statusEligible = statusEligible;
    }

    public boolean isWeightEligible() {
        return weightEligible;
    }

    public void setWeightEligible(boolean weightEligible) {
        this.weightEligible = weightEligible;
    }

    public boolean isWithdrawalEligible() {
        return withdrawalEligible;
    }

    public void setWithdrawalEligible(boolean withdrawalEligible) {
        this.withdrawalEligible = withdrawalEligible;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public String getWithdrawalEndDate() {
        return withdrawalEndDate;
    }

    public void setWithdrawalEndDate(String withdrawalEndDate) {
        this.withdrawalEndDate = withdrawalEndDate;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getWithdrawalStatus() {
        return withdrawalStatus;
    }

    public void setWithdrawalStatus(String withdrawalStatus) {
        this.withdrawalStatus = withdrawalStatus;
    }
}
