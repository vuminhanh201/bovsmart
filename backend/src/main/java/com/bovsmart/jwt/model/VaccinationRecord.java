
package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "vaccination_records")
public class VaccinationRecord {

    @Id
    private String id;

    private String cattleId;
    private String rfidTag;
    private String earTagNumber;

    private String vaccineName;
    private String vaccineType;
    private String dosage;
    private String vaccinationDate;
    private String nextVaccinationDate;
    private String batchNumber;
    private String manufacturer;
    private String notes;

    private String administeredBy;
    private LocalDateTime createdAt;

    public VaccinationRecord() {
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

    public String getVaccinationDate() {
        return vaccinationDate;
    }

    public void setVaccinationDate(String vaccinationDate) {
        this.vaccinationDate = vaccinationDate;
    }

    public String getNextVaccinationDate() {
        return nextVaccinationDate;
    }

    public void setNextVaccinationDate(String nextVaccinationDate) {
        this.nextVaccinationDate = nextVaccinationDate;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getAdministeredBy() {
        return administeredBy;
    }

    public void setAdministeredBy(String administeredBy) {
        this.administeredBy = administeredBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
