
package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "barns")
public class Barn {

    @Id
    private String id;

    private String name;
    private String code;
    private String type;

    private int capacity;
    private int currentCount;

    private String assignedStaff;

    private double temperature;
    private double humidity;
    private double ammonia;

    private String fanStatus;
    private String waterSystem;

    private String lastCleaned;
    private String notes;

    public Barn() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public int getCurrentCount() {
        return currentCount;
    }

    public void setCurrentCount(int currentCount) {
        this.currentCount = currentCount;
    }

    public String getAssignedStaff() {
        return assignedStaff;
    }

    public void setAssignedStaff(String assignedStaff) {
        this.assignedStaff = assignedStaff;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public double getHumidity() {
        return humidity;
    }

    public void setHumidity(double humidity) {
        this.humidity = humidity;
    }

    public double getAmmonia() {
        return ammonia;
    }

    public void setAmmonia(double ammonia) {
        this.ammonia = ammonia;
    }

    public String getFanStatus() {
        return fanStatus;
    }

    public void setFanStatus(String fanStatus) {
        this.fanStatus = fanStatus;
    }

    public String getWaterSystem() {
        return waterSystem;
    }

    public void setWaterSystem(String waterSystem) {
        this.waterSystem = waterSystem;
    }

    public String getLastCleaned() {
        return lastCleaned;
    }

    public void setLastCleaned(String lastCleaned) {
        this.lastCleaned = lastCleaned;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCode() {
    return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
