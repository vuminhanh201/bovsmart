package com.bovsmart.jwt.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public class DashboardStatisticsResponse {

    // Thống kê tổng đàn
    private long totalCattle;
    private Map<String, Long> cattleByStatus;

    // Thống kê kho thức ăn
    private long totalFeedItems;
    private long lowStockFeedCount;
    private BigDecimal feedInventoryValue;

    // Thống kê doanh thu
    private long totalSalesOrders;
    private BigDecimal totalRevenue;

    public DashboardStatisticsResponse() {
    }

    public long getTotalCattle() {
        return totalCattle;
    }

    public void setTotalCattle(long totalCattle) {
        this.totalCattle = totalCattle;
    }

    public Map<String, Long> getCattleByStatus() {
        return cattleByStatus;
    }

    public void setCattleByStatus(Map<String, Long> cattleByStatus) {
        this.cattleByStatus = cattleByStatus;
    }

    public long getTotalFeedItems() {
        return totalFeedItems;
    }

    public void setTotalFeedItems(long totalFeedItems) {
        this.totalFeedItems = totalFeedItems;
    }

    public long getLowStockFeedCount() {
        return lowStockFeedCount;
    }

    public void setLowStockFeedCount(long lowStockFeedCount) {
        this.lowStockFeedCount = lowStockFeedCount;
    }

    public BigDecimal getFeedInventoryValue() {
        return feedInventoryValue;
    }

    public void setFeedInventoryValue(BigDecimal feedInventoryValue) {
        this.feedInventoryValue = feedInventoryValue;
    }

    public long getTotalSalesOrders() {
        return totalSalesOrders;
    }

    public void setTotalSalesOrders(long totalSalesOrders) {
        this.totalSalesOrders = totalSalesOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}