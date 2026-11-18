
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.response.DashboardStatisticsResponse;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.Feed;
import com.bovsmart.jwt.model.SalesOrder;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.FeedRepository;
import com.bovsmart.jwt.repository.SalesOrderRepository;
import com.bovsmart.jwt.service.DashboardStatisticsService;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardStatisticsServiceImpl
        implements DashboardStatisticsService {

    private final CattleRepository cattleRepository;
    private final FeedRepository feedRepository;
    private final SalesOrderRepository salesOrderRepository;

    public DashboardStatisticsServiceImpl(
            CattleRepository cattleRepository,
            FeedRepository feedRepository,
            SalesOrderRepository salesOrderRepository) {

        this.cattleRepository = cattleRepository;
        this.feedRepository = feedRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @Override
    public DashboardStatisticsResponse getDashboardStatistics() {

        DashboardStatisticsResponse response =
                new DashboardStatisticsResponse();

        // 1. Thống kê đàn bò
        List<Cattle> cattleList = cattleRepository.findAll();

        Map<String, Long> cattleByStatus = new HashMap<>();

        for (Cattle cattle : cattleList) {
            String status = cattle.getStatus();

            if (status == null || status.trim().isEmpty()) {
                status = "KHONG_XAC_DINH";
            }

            cattleByStatus.put(
                    status,
                    cattleByStatus.getOrDefault(status, 0L) + 1
            );
        }

        response.setTotalCattle(cattleRepository.count());
        response.setCattleByStatus(cattleByStatus);

        // 2. Thống kê kho thức ăn
        List<Feed> feedList = feedRepository.findAll();

        BigDecimal feedInventoryValue = BigDecimal.ZERO;

        for (Feed feed : feedList) {
            BigDecimal quantity =
                    BigDecimal.valueOf(feed.getQuantity());

            BigDecimal unitPrice =
                    BigDecimal.valueOf(feed.getUnitPrice());

            feedInventoryValue = feedInventoryValue.add(
                    quantity.multiply(unitPrice)
            );
        }

        response.setTotalFeedItems(feedRepository.count());
        response.setLowStockFeedCount(
                feedRepository.findLowStockFeeds().size()
        );
        response.setFeedInventoryValue(feedInventoryValue);

        // 3. Thống kê đơn bán và doanh thu
        List<SalesOrder> completedOrders =
                salesOrderRepository.findByStatus("COMPLETED");

        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (SalesOrder order : completedOrders) {
            if (order.getTotalAmount() != null) {
                totalRevenue = totalRevenue.add(
                        order.getTotalAmount()
                );
            }
        }

        response.setTotalSalesOrders(completedOrders.size());
        response.setTotalRevenue(totalRevenue);

        return response;
    }
}
