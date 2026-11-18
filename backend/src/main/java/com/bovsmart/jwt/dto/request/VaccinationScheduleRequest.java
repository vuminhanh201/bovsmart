
package com.bovsmart.jwt.dto.request;

import java.util.List;

public class VaccinationScheduleRequest {

    private String targetGroup;
    private List<String> cattleIds;

    private String vaccineName;
    private String vaccineType;
    private String dosage;

    private String scheduledDate;

    private String assignedVeterinarianEmail;

    private String notes;

    public VaccinationScheduleRequest() {
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
