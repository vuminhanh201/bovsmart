
package com.bovsmart.jwt.dto.request;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class DailyDiaryRequest {

    private LocalDate date;
    private String shift;

    private List<PenActivityRequest> penActivities = new ArrayList<>();

    private String generalObservations;
    private String weather;
    private double tempAvg;

    public DailyDiaryRequest() {
    }

    public static class PenActivityRequest {

        private String penId;
        private String penName;
        private boolean cleaned;
        private boolean waterChecked;
        private double feedEatenPercentage;
        private String unusualBehavior;

        public PenActivityRequest() {
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

    public List<PenActivityRequest> getPenActivities() {
        return penActivities;
    }

    public void setPenActivities(List<PenActivityRequest> penActivities) {
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
}
