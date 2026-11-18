package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "feeds")
public class Feed {

    @Id
    private String id;

    private String feedCode;
    private String feedName;
    private String categoryId;
    private String categoryName;
    private String unit;
    private double quantity;
    private double minStock;
    private double unitPrice;
    private String description;
    private String status;

    public Feed() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFeedCode() {
        return feedCode;
    }

    public void setFeedCode(String feedCode) {
        this.feedCode = feedCode;
    }

    public String getFeedName() {
        return feedName;
    }

    public void setFeedName(String feedName) {
        this.feedName = feedName;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public double getQuantity() {
        return quantity;
    }

    public void setQuantity(double quantity) {
        this.quantity = quantity;
    }

    public double getMinStock() {
        return minStock;
    }

    public void setMinStock(double minStock) {
        this.minStock = minStock;
    }

    public double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}