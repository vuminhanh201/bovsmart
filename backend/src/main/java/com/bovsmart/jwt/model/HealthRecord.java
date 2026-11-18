
package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "health_records")
public class HealthRecord {

    @Id
    private String id;

    private String cattleId;
    private String rfidTag;
    private String earTagNumber;

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
    private String withdrawalEndDate;
    private String withdrawalStatus = "NOT_CONFIRMED";

    // Tiến độ xử lý hồ sơ sức khỏe
    private String recordStatus = "PENDING_VET_REVIEW";

    // Thông tin tiếp nhận và khám của thú y
    private String vetReviewedBy;
    private LocalDateTime vetReviewedAt;

    // Thông tin xác nhận của quản lý
    private String managerConfirmedBy;
    private LocalDateTime managerConfirmedAt;

    private String notes;

    private String recordedBy;
    private LocalDateTime createdAt;

    // Thông tin quản lý phân công nhân viên thú y
    private String assignedVetId;
    private String assignedVetEmail;
    private String assignedVetName;
    private String assignedBy;
    private LocalDateTime assignedAt;

    public HealthRecord() {
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

    public String getWithdrawalEndDate() {
        return withdrawalEndDate;
    }

    public void setWithdrawalEndDate(String withdrawalEndDate) {
        this.withdrawalEndDate = withdrawalEndDate;
    }

    public String getWithdrawalStatus() {
        return withdrawalStatus;
    }

    public void setWithdrawalStatus(String withdrawalStatus) {
        this.withdrawalStatus = withdrawalStatus;
    }

    public String getRecordStatus() {
        return recordStatus;
    }

    public void setRecordStatus(String recordStatus) {
        this.recordStatus = recordStatus;
    }

    public String getVetReviewedBy() {
        return vetReviewedBy;
    }

    public void setVetReviewedBy(String vetReviewedBy) {
        this.vetReviewedBy = vetReviewedBy;
    }

    public LocalDateTime getVetReviewedAt() {
        return vetReviewedAt;
    }

    public void setVetReviewedAt(LocalDateTime vetReviewedAt) {
        this.vetReviewedAt = vetReviewedAt;
    }

    public String getManagerConfirmedBy() {
        return managerConfirmedBy;
    }

    public void setManagerConfirmedBy(String managerConfirmedBy) {
        this.managerConfirmedBy = managerConfirmedBy;
    }

    public LocalDateTime getManagerConfirmedAt() {
        return managerConfirmedAt;
    }

    public void setManagerConfirmedAt(LocalDateTime managerConfirmedAt) {
        this.managerConfirmedAt = managerConfirmedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(String recordedBy) {
        this.recordedBy = recordedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getAssignedVetId() {
        return assignedVetId;
    }

    public void setAssignedVetId(String assignedVetId) {
        this.assignedVetId = assignedVetId;
    }

    public String getAssignedVetEmail() {
        return assignedVetEmail;
    }

    public void setAssignedVetEmail(String assignedVetEmail) {
        this.assignedVetEmail = assignedVetEmail;
    }

    public String getAssignedVetName() {
        return assignedVetName;
    }

    public void setAssignedVetName(String assignedVetName) {
        this.assignedVetName = assignedVetName;
    }

    public String getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
}
