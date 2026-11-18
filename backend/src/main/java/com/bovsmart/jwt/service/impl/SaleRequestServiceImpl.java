
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.SalesOrderRequest;
import com.bovsmart.jwt.dto.request.SaleRequestReviewRequest;
import com.bovsmart.jwt.model.SaleRequest;
import com.bovsmart.jwt.repository.SaleRequestRepository;
import com.bovsmart.jwt.service.SaleRequestService;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.List;

@Profile("sale-request-enabled")
@Service
public class SaleRequestServiceImpl implements SaleRequestService {

    private final SaleRequestRepository saleRequestRepository;

    public SaleRequestServiceImpl(
            SaleRequestRepository saleRequestRepository) {
        this.saleRequestRepository = saleRequestRepository;
    }

    @Override
    public SaleRequest createSaleRequest(
            SalesOrderRequest request,
            String requestedBy) {
        throw new UnsupportedOperationException(
                "Module SaleRequest đã ngừng sử dụng. "
                + "Vui lòng sử dụng SalesOrder."
        );
    }

    @Override
    public List<SaleRequest> getAllSaleRequests() {
        return saleRequestRepository.findAll();
    }

    @Override
    public List<SaleRequest> getMySaleRequests(String requestedBy) {
        return saleRequestRepository.findByRequestedBy(requestedBy);
    }

    @Override
    public SaleRequest getSaleRequestById(String id) {
        return saleRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy yêu cầu xuất bán: " + id
                ));
    }

    @Override
    public SaleRequest approveSaleRequest(
            String id,
            String reviewedBy) {
        throw new UnsupportedOperationException(
                "Module SaleRequest đã ngừng sử dụng. "
                + "Vui lòng sử dụng SalesOrder."
        );
    }

    @Override
    public SaleRequest rejectSaleRequest(
            String id,
            SaleRequestReviewRequest request,
            String reviewedBy) {
        throw new UnsupportedOperationException(
                "Module SaleRequest đã ngừng sử dụng. "
                + "Vui lòng sử dụng SalesOrder."
        );
    }
}
