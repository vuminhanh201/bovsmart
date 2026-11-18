
package com.bovsmart.jwt.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "daily_diaries")
public class DailyDiary {

    @Id
    private String id;

    private LocalDate date;

    // CA_SANG, CA_CHIEU, CA_DEM
    private String shift;

    private String authorId;
    private String authorName;
    private String authorRole;

    private List<PenActivity> penActivities = new ArrayList<>();

    private String generalObservations;

    // Nang_Rao, Mua_Am, Gió_Lanh
    private String weather;

    private double tempAvg;

    private String verifiedByManager;
    private LocalDateTime verifiedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DailyDiary() {
    }

    public static class PenActivity {

        private String penId;
        private String penName;
        private boolean cleaned;
        private boolean waterChecked;
        private double feedEatenPercentage;
        private String unusualBehavior;

        public PenActivity() {
        }

        public String getPenId() {
            return penId;
        }

        public void setPenId(String penId) {
            this.penId = penId;
        }

        public String getPenName() {
            return penName;
        }

        public void setPenName(String penName) {
            this.penName = penName;
        }

        public boolean isCleaned() {
            return cleaned;
        }

        public void setCleaned(boolean cleaned) {
            this.cleaned = cleaned;
        }

        public boolean isWaterChecked() {
            return waterChecked;
        }

        public void setWaterChecked(boolean waterChecked) {
            this.waterChecked = waterChecked;
        }

        public double getFeedEatenPercentage() {
            return feedEatenPercentage;
        }

        public void setFeedEatenPercentage(double feedEatenPercentage) {
            this.feedEatenPercentage = feedEatenPercentage;
        }

        public String getUnusualBehavior() {
            return unusualBehavior;
        }

        public void setUnusualBehavior(String unusualBehavior) {
            this.unusualBehavior = unusualBehavior;
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getShift() {
        return shift;
    }

    public void setShift(String shift) {
        this.shift = shift;
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorRole() {
        return authorRole;
    }

    public void setAuthorRole(String authorRole) {
        this.authorRole = authorRole;
    }

    public List<PenActivity> getPenActivities() {
        return penActivities;
    }

    public void setPenActivities(List<PenActivity> penActivities) {
        this.penActivities = penActivities;
    }

    public String getGeneralObservations() {
        return generalObservations;
    }

    public void setGeneralObservations(String generalObservations) {
        this.generalObservations = generalObservations;
    }

    public String getWeather() {
        return weather;
    }

    public void setWeather(String weather) {
        this.weather = weather;
    }

    public double getTempAvg() {
        return tempAvg;
    }

    public void setTempAvg(double tempAvg) {
        this.tempAvg = tempAvg;
    }

    public String getVerifiedByManager() {
        return verifiedByManager;
    }

    public void setVerifiedByManager(String verifiedByManager) {
        this.verifiedByManager = verifiedByManager;
    }

    public LocalDateTime getVerifiedAt() {
        return verifiedAt;
    }

    public void setVerifiedAt(LocalDateTime verifiedAt) {
        this.verifiedAt = verifiedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
