
package com.bovsmart.jwt.dto.request;

public class HealthRecordRequest {

    private String cattleId;
    private String examinationDate;
    private String symptoms;
    private String diagnosis;

    private String treatment;
    private String medicine;
    private String dosage;

    private String treatmentStartDate;
    private String treatmentEndDate;
    private String followUpDate;

    private Integer withdrawalPeriodDays;
    private String notes;

    public HealthRecordRequest() {
    }

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getExaminationDate() {
        return examinationDate;
    }

    public void setExaminationDate(String examinationDate) {
        this.examinationDate = examinationDate;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public void setDiagnosis(String diagnosis) {
        this.diagnosis = diagnosis;
    }

    public String getTreatment() {
        return treatment;
    }

    public void setTreatment(String treatment) {
        this.treatment = treatment;
    }

    public String getMedicine() {
        return medicine;
    }

    public void setMedicine(String medicine) {
        this.medicine = medicine;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getTreatmentStartDate() {
        return treatmentStartDate;
    }

    public void setTreatmentStartDate(String treatmentStartDate) {
        this.treatmentStartDate = treatmentStartDate;
    }

    public String getTreatmentEndDate() {
        return treatmentEndDate;
    }

    public void setTreatmentEndDate(String treatmentEndDate) {
        this.treatmentEndDate = treatmentEndDate;
    }

    public String getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(String followUpDate) {
        this.followUpDate = followUpDate;
    }

    public Integer getWithdrawalPeriodDays() {
        return withdrawalPeriodDays;
    }

    public void setWithdrawalPeriodDays(Integer withdrawalPeriodDays) {
        this.withdrawalPeriodDays = withdrawalPeriodDays;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
