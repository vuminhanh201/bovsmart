
package com.bovsmart.jwt.model;

public class WeightRecord {

    private String id;
    private String date;
    private double weight;
    private String recordedBy;
    private String note;
    private String method;
    private String source;

    public WeightRecord() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public void setRecordedBy(String recordedBy) {
        this.recordedBy = recordedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
