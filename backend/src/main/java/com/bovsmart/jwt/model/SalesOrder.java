
package com.bovsmart.jwt.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "sales_orders")
public class SalesOrder {

    @Id
    private String id;

    // Mã phiếu xuất bán
    private String orderCode;

    // Danh sách bò trong phiếu
    private List<SalesOrderCattle> cattleDetails = new ArrayList<>();

    // Các trường tương thích với dữ liệu phiếu cũ
    private String cattleId;
    private String earTagNumber;
    private String cattleName;
    private double weightAtSale;

    // Thông tin người mua
    private String buyerName;
    private String buyerPhone;
    private String buyerAddress;

    // Thông tin giao dịch
    private LocalDateTime saleDate;
    private BigDecimal pricePerKg;
    private BigDecimal totalWeight;
    private BigDecimal totalAmount;

    // Trạng thái phiếu
    private String status;

    // Người lập phiếu
    private String createdBy;

    // Thông tin phê duyệt
    private String approvedBy;
    private LocalDateTime approvedAt;

    // Thông tin từ chối
    private String rejectedBy;
    private LocalDateTime rejectedAt;
    private String rejectionReason;

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SalesOrder() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public List<SalesOrderCattle> getCattleDetails() {
        return cattleDetails;
    }

    public void setCattleDetails(List<SalesOrderCattle> cattleDetails) {
        this.cattleDetails = cattleDetails;
    }

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getEarTagNumber() {
        return earTagNumber;
    }

    public void setEarTagNumber(String earTagNumber) {
        this.earTagNumber = earTagNumber;
    }

    public String getCattleName() {
        return cattleName;
    }

    public void setCattleName(String cattleName) {
        this.cattleName = cattleName;
    }

    public double getWeightAtSale() {
        return weightAtSale;
    }

    public void setWeightAtSale(double weightAtSale) {
        this.weightAtSale = weightAtSale;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerPhone() {
        return buyerPhone;
    }

    public void setBuyerPhone(String buyerPhone) {
        this.buyerPhone = buyerPhone;
    }

    public String getBuyerAddress() {
        return buyerAddress;
    }

    public void setBuyerAddress(String buyerAddress) {
        this.buyerAddress = buyerAddress;
    }

    public LocalDateTime getSaleDate() {
        return saleDate;
    }

    public void setSaleDate(LocalDateTime saleDate) {
        this.saleDate = saleDate;
    }

    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public BigDecimal getTotalWeight() {
        return totalWeight;
    }

    public void setTotalWeight(BigDecimal totalWeight) {
        this.totalWeight = totalWeight;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getRejectedBy() {
        return rejectedBy;
    }

    public void setRejectedBy(String rejectedBy) {
        this.rejectedBy = rejectedBy;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    // Thông tin từng con bò trong phiếu
    public static class SalesOrderCattle {

        private String cattleId;
        private String earTagNumber;
        private String cattleName;
        private double weightAtSale;

        public SalesOrderCattle() {
        }

        public SalesOrderCattle(
                String cattleId,
                String earTagNumber,
                String cattleName,
                double weightAtSale
        ) {
            this.cattleId = cattleId;
            this.earTagNumber = earTagNumber;
            this.cattleName = cattleName;
            this.weightAtSale = weightAtSale;
        }

        public String getCattleId() {
            return cattleId;
        }

        public void setCattleId(String cattleId) {
            this.cattleId = cattleId;
        }

        public String getEarTagNumber() {
            return earTagNumber;
        }

        public void setEarTagNumber(String earTagNumber) {
            this.earTagNumber = earTagNumber;
        }

        public String getCattleName() {
            return cattleName;
        }

        public void setCattleName(String cattleName) {
            this.cattleName = cattleName;
        }

        public double getWeightAtSale() {
            return weightAtSale;
        }

        public void setWeightAtSale(double weightAtSale) {
            this.weightAtSale = weightAtSale;
        }
    }
}
