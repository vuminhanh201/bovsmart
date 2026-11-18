
package com.bovsmart.jwt.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vaccination_schedules")
public class VaccinationSchedule {

    @Id
    private String id;

    private String targetGroup;
    private List<String> cattleIds = new ArrayList<>();

    private String vaccineName;
    private String vaccineType;
    private String dosage;

    private String scheduledDate;

    private String assignedVeterinarianEmail;
    private String assignedVeterinarianName;

    // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    private String status = "SCHEDULED";

    private String notes;

    private String createdBy;
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    public VaccinationSchedule() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTargetGroup() {
        return targetGroup;
    }

    public void setTargetGroup(String targetGroup) {
        this.targetGroup = targetGroup;
    }

    public List<String> getCattleIds() {
        return cattleIds;
    }

    public void setCattleIds(List<String> cattleIds) {
        this.cattleIds = cattleIds;
    }

    public String getVaccineName() {
        return vaccineName;
    }

    public void setVaccineName(String vaccineName) {
        this.vaccineName = vaccineName;
    }

    public String getVaccineType() {
        return vaccineType;
    }

    public void setVaccineType(String vaccineType) {
        this.vaccineType = vaccineType;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public String getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(String scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public String getAssignedVeterinarianEmail() {
        return assignedVeterinarianEmail;
    }

    public void setAssignedVeterinarianEmail(String assignedVeterinarianEmail) {
        this.assignedVeterinarianEmail = assignedVeterinarianEmail;
    }

    public String getAssignedVeterinarianName() {
        return assignedVeterinarianName;
    }

    public void setAssignedVeterinarianName(String assignedVeterinarianName) {
        this.assignedVeterinarianName = assignedVeterinarianName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}
