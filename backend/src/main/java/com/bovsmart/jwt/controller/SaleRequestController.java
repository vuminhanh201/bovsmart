package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.SalesOrderRequest;
import com.bovsmart.jwt.dto.request.SaleRequestReviewRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.SaleRequest;
import com.bovsmart.jwt.service.SaleRequestService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.context.annotation.Profile;

import java.security.Principal;
import java.util.List;

@Profile("sale-request-enabled")
@RestController
@RequestMapping("/api/sale-requests")
public class SaleRequestController {

    private final SaleRequestService saleRequestService;

    public SaleRequestController(SaleRequestService saleRequestService) {
        this.saleRequestService = saleRequestService;
    }

    // STAFF và FARM_MANAGER gửi yêu cầu
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> createSaleRequest(
            @Valid @RequestBody SalesOrderRequest request,
            Principal principal) {

        SaleRequest result = saleRequestService.createSaleRequest(
                request,
                principal.getName()
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        result,
                        "Gửi yêu cầu xuất bán thành công!"
                )
        );
    }

    // FARM_MANAGER xem tất cả yêu cầu
    @GetMapping
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> getAllSaleRequests() {

        List<SaleRequest> requests =
                saleRequestService.getAllSaleRequests();

        return ResponseEntity.ok(
                ResponseModel.success(
                        requests,
                        "Lấy danh sách yêu cầu xuất bán thành công!"
                )
        );
    }

    // STAFF xem yêu cầu của mình
    @GetMapping("/my-requests")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> getMySaleRequests(
            Principal principal) {

        List<SaleRequest> requests =
                saleRequestService.getMySaleRequests(principal.getName());

        return ResponseEntity.ok(
                ResponseModel.success(
                        requests,
                        "Lấy yêu cầu xuất bán của bạn thành công!"
                )
        );
    }

    // FARM_MANAGER xem chi tiết yêu cầu
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> getSaleRequestById(
            @PathVariable String id) {

        SaleRequest request =
                saleRequestService.getSaleRequestById(id);

        return ResponseEntity.ok(
                ResponseModel.success(
                        request,
                        "Lấy chi tiết yêu cầu xuất bán thành công!"
                )
        );
    }

    // FARM_MANAGER duyệt yêu cầu
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> approveSaleRequest(
            @PathVariable String id,
            Principal principal) {

        SaleRequest result = saleRequestService.approveSaleRequest(
                id,
                principal.getName()
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        result,
                        "Duyệt yêu cầu xuất bán thành công!"
                )
        );
    }

    // FARM_MANAGER từ chối yêu cầu
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<?>> rejectSaleRequest(
            @PathVariable String id,
            @Valid @RequestBody SaleRequestReviewRequest request,
            Principal principal) {

        SaleRequest result = saleRequestService.rejectSaleRequest(
                id,
                request,
                principal.getName()
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        result,
                        "Từ chối yêu cầu xuất bán thành công!"
                )
        );
    }
}