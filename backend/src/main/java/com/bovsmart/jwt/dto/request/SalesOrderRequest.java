
package com.bovsmart.jwt.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SalesOrderRequest {

    @NotEmpty(message = "Phải chọn ít nhất một con bò")
    private List<@NotBlank(message = "ID bò không được để trống") String> cattleIds;

    @NotBlank(message = "Tên người mua không được để trống")
    private String buyerName;

    private String buyerPhone;

    private String buyerAddress;

    @NotNull(message = "Ngày xuất bán không được để trống")
    private LocalDateTime saleDate;

    @NotNull(message = "Đơn giá không được để trống")
    @DecimalMin(value = "0.01", message = "Đơn giá phải lớn hơn 0")
    private BigDecimal pricePerKg;

    private String notes;

    public SalesOrderRequest() {
    }

    public List<String> getCattleIds() {
        return cattleIds;
    }

    public void setCattleIds(List<String> cattleIds) {
        this.cattleIds = cattleIds;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
