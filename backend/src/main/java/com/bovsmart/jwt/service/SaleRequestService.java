package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.SalesOrderRequest;
import com.bovsmart.jwt.dto.request.SaleRequestReviewRequest;
import com.bovsmart.jwt.model.SaleRequest;

import java.util.List;

public interface SaleRequestService {

    SaleRequest createSaleRequest(
            SalesOrderRequest request,
            String requestedBy
    );

    List<SaleRequest> getAllSaleRequests();

    List<SaleRequest> getMySaleRequests(String requestedBy);

    SaleRequest getSaleRequestById(String id);

    SaleRequest approveSaleRequest(
            String id,
            String reviewedBy
    );

    SaleRequest rejectSaleRequest(
            String id,
            SaleRequestReviewRequest request,
            String reviewedBy
    );
}