package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.dto.response.DashboardStatisticsResponse;
import com.bovsmart.jwt.service.DashboardStatisticsService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardStatisticsController {

    private final DashboardStatisticsService dashboardStatisticsService;

    public DashboardStatisticsController(
            DashboardStatisticsService dashboardStatisticsService) {
        this.dashboardStatisticsService = dashboardStatisticsService;
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<DashboardStatisticsResponse>>
            getDashboardStatistics() {

        DashboardStatisticsResponse data =
                dashboardStatisticsService.getDashboardStatistics();

        return ResponseEntity.ok(
                new ResponseModel<>(
                        1,
                        data,
                        "Lấy thống kê trang trại thành công"
                )
        );
    }
}