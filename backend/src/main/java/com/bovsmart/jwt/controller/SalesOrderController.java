
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.SalesOrderRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.SalesOrder;
import com.bovsmart.jwt.service.SalesOrderService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales-orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    // STAFF / FARM_MANAGER lập phiếu
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> createSalesOrder(
            @Valid @RequestBody SalesOrderRequest request,
            Principal principal) {

        String role = getCurrentRole();

        SalesOrder order = salesOrderService.createSalesOrder(
                request,
                principal.getName(),
                role
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        order,
                        "Lập phiếu xuất bán thành công! Phiếu đang chờ phê duyệt."
                ));
    }

    // ADMIN / FARM_MANAGER / STAFF xem danh sách
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<?>> getAllSalesOrders() {

        List<SalesOrder> orders =
                salesOrderService.getAllSalesOrders();

        return ResponseEntity.ok(
                ResponseModel.success(
                        orders,
                        "Lấy danh sách phiếu xuất bán thành công!"
                )
        );
    }

    // ADMIN / FARM_MANAGER / STAFF xem chi tiết
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<?>> getSalesOrderById(
            @PathVariable String id) {

        SalesOrder order =
                salesOrderService.getSalesOrderById(id);

        return ResponseEntity.ok(
                ResponseModel.success(
                        order,
                        "Lấy chi tiết phiếu xuất bán thành công!"
                )
        );
    }

    // ADMIN / FARM_MANAGER / STAFF xem lịch sử xuất bán của bò
    @GetMapping("/cattle/{cattleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<?>> getSalesOrdersByCattleId(
            @PathVariable String cattleId) {

        List<SalesOrder> orders =
                salesOrderService.getSalesOrdersByCattleId(cattleId);

        return ResponseEntity.ok(
                ResponseModel.success(
                        orders,
                        "Lấy lịch sử xuất bán thành công!"
                )
        );
    }

    // Chỉ FARM_MANAGER được phê duyệt
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> approveSalesOrder(
            @PathVariable String id,
            Principal principal) {

        SalesOrder order = salesOrderService.approveSalesOrder(
                id,
                principal.getName(),
                "FARM_MANAGER"
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        order,
                        "Phê duyệt phiếu xuất bán thành công!"
                )
        );
    }

    // Chỉ FARM_MANAGER được từ chối
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> rejectSalesOrder(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            Principal principal) {

        String reason = request.get("reason");

        SalesOrder order = salesOrderService.rejectSalesOrder(
                id,
                principal.getName(),
                reason,
                "FARM_MANAGER"
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        order,
                        "Từ chối phiếu xuất bán thành công!"
                )
        );
    }

    // Lấy role từ JWT Authentication
    private String getCurrentRole() {
        return org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getAuthorities()
                .stream()
                .map(authority -> authority.getAuthority())
                .filter(authority ->
                        authority.equals("ROLE_STAFF")
                                || authority.equals("ROLE_FARM_MANAGER")
                )
                .map(authority -> authority.replace("ROLE_", ""))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Không xác định được vai trò người dùng."
                        )
                );
    }
}
