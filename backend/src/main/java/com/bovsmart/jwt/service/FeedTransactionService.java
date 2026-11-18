package com.bovsmart.jwt.service;

import java.util.List;

import com.bovsmart.jwt.model.FeedTransaction;

public interface FeedTransactionService {

    // Tạo phiếu nhập hoặc xuất kho
    FeedTransaction createTransaction(
            String feedId,
            String transactionType,
            Double quantity,
            Double unitPrice,
            String note,
            String createdBy
    );

    // Xác nhận phiếu
    FeedTransaction approveTransaction(
            String transactionId,
            String reviewedBy,
            String reviewNote
    );

    // Từ chối phiếu
    FeedTransaction rejectTransaction(
            String transactionId,
            String reviewedBy,
            String reviewNote
    );

    // Lấy toàn bộ lịch sử nhập xuất
    List<FeedTransaction> getAllTransactions();

    // Lấy chi tiết phiếu
    FeedTransaction getTransactionById(String id);

    // Lọc theo loại giao dịch
    List<FeedTransaction> getTransactionsByType(String transactionType);

    // Lọc theo trạng thái
    List<FeedTransaction> getTransactionsByStatus(String transactionStatus);

    // Lấy lịch sử theo thức ăn
    List<FeedTransaction> getTransactionsByFeedId(String feedId);
}