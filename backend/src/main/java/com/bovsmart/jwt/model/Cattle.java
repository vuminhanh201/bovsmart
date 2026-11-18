
package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "cattle")
public class Cattle {

    @Id
    private String id;

    private String rfidTag;
    private String earTagNumber;
    private String name;
    private String breed;
    private String gender;
    private String dob;
    private int ageMonths;

    private double weight;
    private double initialWeight;

    private String penId;
    private String status;

    private String motherId;
    private String fatherId;

    private String origin;
    private String entryDate;

    private String photoUrl;
    private int withdrawalDaysRemaining;
    private double targetMarketWeight;

    private String qrCodeData;
    private String blockchainHash;

    private List<WeightRecord> weightHistory = new ArrayList<>();

    private String notes;

    public Cattle() {
    }

    public String getId() { 
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public int getAgeMonths() {
        return ageMonths;
    }

    public void setAgeMonths(int ageMonths) {
        this.ageMonths = ageMonths;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public double getInitialWeight() {
        return initialWeight;
    }

    public void setInitialWeight(double initialWeight) {
        this.initialWeight = initialWeight;
    }

    public String getPenId() {
        return penId;
    }

    public void setPenId(String penId) {
        this.penId = penId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMotherId() {
        return motherId;
    }

    public void setMotherId(String motherId) {
        this.motherId = motherId;
    }

    public String getFatherId() {
        return fatherId;
    }

    public void setFatherId(String fatherId) {
        this.fatherId = fatherId;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(String entryDate) {
        this.entryDate = entryDate;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public int getWithdrawalDaysRemaining() {
        return withdrawalDaysRemaining;
    }

    public void setWithdrawalDaysRemaining(int withdrawalDaysRemaining) {
        this.withdrawalDaysRemaining = withdrawalDaysRemaining;
    }

    public double getTargetMarketWeight() {
        return targetMarketWeight;
    }

    public void setTargetMarketWeight(double targetMarketWeight) {
        this.targetMarketWeight = targetMarketWeight;
    }

    public String getQrCodeData() {
        return qrCodeData;
    }

    public void setQrCodeData(String qrCodeData) {
        this.qrCodeData = qrCodeData;
    }

    public String getBlockchainHash() {
        return blockchainHash;
    }

    public void setBlockchainHash(String blockchainHash) {
        this.blockchainHash = blockchainHash;
    }

    public List<WeightRecord> getWeightHistory() {
        return weightHistory;
    }

    public void setWeightHistory(List<WeightRecord> weightHistory) {
        this.weightHistory = weightHistory;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
