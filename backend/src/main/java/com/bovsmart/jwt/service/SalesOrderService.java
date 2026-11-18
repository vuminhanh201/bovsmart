package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.SalesOrderRequest;
import com.bovsmart.jwt.model.SalesOrder;

import java.util.List;

public interface SalesOrderService {

    SalesOrder createSalesOrder(
            SalesOrderRequest request,
            String createdBy,
            String role
    );

    List<SalesOrder> getAllSalesOrders();

    SalesOrder getSalesOrderById(String id);

    List<SalesOrder> getSalesOrdersByCattleId(String cattleId);

    SalesOrder approveSalesOrder(
            String orderId,
            String approver,
            String role
    );

    SalesOrder rejectSalesOrder(
            String orderId,
            String rejectedBy,
            String reason,
            String role
    );
}