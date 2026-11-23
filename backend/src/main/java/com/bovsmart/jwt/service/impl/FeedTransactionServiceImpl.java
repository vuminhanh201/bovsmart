
package com.bovsmart.jwt.service.impl;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.bovsmart.jwt.model.Feed;
import com.bovsmart.jwt.model.FeedTransaction;
import com.bovsmart.jwt.repository.FeedRepository;
import com.bovsmart.jwt.repository.FeedTransactionRepository;
import com.bovsmart.jwt.service.FeedTransactionService;
import com.bovsmart.jwt.service.BlockchainService;
import com.bovsmart.jwt.service.AuditLogService;

@Service
public class FeedTransactionServiceImpl implements FeedTransactionService {

        private final FeedRepository feedRepository;
        private final FeedTransactionRepository transactionRepository;
        private final BlockchainService blockchainService;
        private final AuditLogService auditLogService;

        public FeedTransactionServiceImpl(
                        FeedRepository feedRepository,
                        FeedTransactionRepository transactionRepository,
                        BlockchainService blockchainService,
                        AuditLogService auditLogService) {

                this.feedRepository = feedRepository;
                this.transactionRepository = transactionRepository;
                this.blockchainService = blockchainService;
                this.auditLogService = auditLogService;
        }

        // Tạo phiếu nhập/xuất
        @Override
        public FeedTransaction createTransaction(
                        String feedId,
                        String transactionType,
                        Double quantity,
                        Double unitPrice,
                        String note,
                        String createdBy) {

                Feed feed = feedRepository.findById(feedId)
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy thức ăn!"));

                if ("INACTIVE".equalsIgnoreCase(feed.getStatus())) {
                        throw new RuntimeException(
                                        "Nguyên liệu đã ngừng sử dụng, không thể tạo phiếu nhập/xuất!");
                }

                if (quantity == null || quantity <= 0) {
                        throw new RuntimeException("Số lượng phải lớn hơn 0!");
                }

                if (!"IMPORT".equals(transactionType)
                                && !"EXPORT".equals(transactionType)) {
                        throw new RuntimeException("Loại giao dịch không hợp lệ!");
                }

                if ("EXPORT".equals(transactionType)
                                && feed.getQuantity() < quantity) {
                        throw new RuntimeException(
                                        "Số lượng tồn kho không đủ để xuất!");
                }

                if ("IMPORT".equals(transactionType)
                                && (unitPrice == null || unitPrice < 0)) {
                        throw new RuntimeException("Đơn giá nhập không hợp lệ!");
                }

                FeedTransaction transaction = new FeedTransaction();

                transaction.setFeedId(feed.getId());
                transaction.setFeedCode(feed.getFeedCode());
                transaction.setFeedName(feed.getFeedName());
                transaction.setTransactionType(transactionType);
                transaction.setQuantity(quantity);
                transaction.setUnit(feed.getUnit());

                Double transactionUnitPrice = "IMPORT".equals(transactionType)
                                ? unitPrice
                                : feed.getUnitPrice();

                transaction.setUnitPrice(transactionUnitPrice);

                double price = transactionUnitPrice == null
                                ? 0.0
                                : transactionUnitPrice;

                transaction.setTotalAmount(price * quantity);
                transaction.setNote(note);
                transaction.setCreatedBy(createdBy);
                transaction.setTransactionStatus("PENDING");
                transaction.setTransactionDate(LocalDateTime.now());

                // Chỉ lưu phiếu chờ duyệt, chưa cập nhật tồn kho.
                return transactionRepository.save(transaction);
        }

        // Duyệt phiếu nhập/xuất
        @Override
        public FeedTransaction approveTransaction(
                        String transactionId,
                        String reviewedBy,
                        String reviewNote) {

                FeedTransaction transaction = getTransactionById(transactionId);

                if (!"PENDING".equals(transaction.getTransactionStatus())) {
                        throw new RuntimeException("Phiếu này đã được xử lý!");
                }

                // Không cho phép người tạo tự xác nhận phiếu.
                if (transaction.getCreatedBy() != null
                                && transaction.getCreatedBy().equalsIgnoreCase(reviewedBy)) {
                        throw new RuntimeException(
                                        "Người tạo phiếu không được tự xác nhận phiếu!");
                }

                Feed feed = feedRepository.findById(transaction.getFeedId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy thức ăn!"));

                if ("INACTIVE".equalsIgnoreCase(feed.getStatus())) {
                        throw new RuntimeException(
                                        "Nguyên liệu đã ngừng sử dụng, không thể duyệt phiếu nhập/xuất!");
                }

                Double quantity = transaction.getQuantity();

                double oldQuantity = feed.getQuantity();

                if (quantity == null || quantity <= 0) {
                        throw new RuntimeException("Số lượng giao dịch không hợp lệ!");
                }

                if ("IMPORT".equals(transaction.getTransactionType())) {

                        feed.setQuantity(oldQuantity + quantity);

                        if (transaction.getUnitPrice() != null) {
                                feed.setUnitPrice(transaction.getUnitPrice());
                        }

                } else if ("EXPORT".equals(transaction.getTransactionType())) {

                        if (oldQuantity < quantity) {
                                throw new RuntimeException(
                                                "Số lượng tồn kho hiện tại không đủ để xuất!");
                        }

                        feed.setQuantity(oldQuantity - quantity);

                } else {
                        throw new RuntimeException("Loại giao dịch không hợp lệ!");
                }

                // Cập nhật tồn kho.
                feedRepository.save(feed);

                // Cập nhật trạng thái phiếu.
                transaction.setTransactionStatus("APPROVED");
                transaction.setReviewedBy(reviewedBy);
                transaction.setReviewNote(reviewNote);
                transaction.setReviewedAt(LocalDateTime.now());

                FeedTransaction savedTransaction = transactionRepository.save(transaction);

                // Chuẩn bị dữ liệu ghi nhận.
                Map<String, Object> details = new LinkedHashMap<>();
                details.put("transactionId", savedTransaction.getId());
                details.put("feedId", feed.getId());
                details.put("feedCode", feed.getFeedCode());
                details.put("feedName", feed.getFeedName());
                details.put("transactionType", savedTransaction.getTransactionType());
                details.put("quantity", quantity);
                details.put("unit", feed.getUnit());
                details.put("oldStock", oldQuantity);
                details.put("newStock", feed.getQuantity());
                details.put("createdBy", savedTransaction.getCreatedBy());
                details.put("reviewedBy", reviewedBy);
                details.put("status", "APPROVED");

                String action = "IMPORT".equals(savedTransaction.getTransactionType())
                                ? "APPROVE_FEED_IMPORT"
                                : "APPROVE_FEED_EXPORT";

                String description = "Đã duyệt phiếu "
                                + ("IMPORT".equals(savedTransaction.getTransactionType())
                                                ? "nhập"
                                                : "xuất")
                                + " thức ăn " + feed.getFeedName()
                                + ", số lượng " + quantity + " " + feed.getUnit()
                                + ". Tồn kho thay đổi từ " + oldQuantity
                                + " thành " + feed.getQuantity() + ".";

                // Ghi Blockchain sau khi giao dịch kho được duyệt.
                blockchainService.createBlock(
                                action,
                                details,
                                reviewedBy,
                                "FARM_MANAGER");

                // Ghi Audit Log.
                auditLogService.createLog(
                                reviewedBy,
                                "FARM_MANAGER",
                                action,
                                "FEED_TRANSACTION",
                                savedTransaction.getId(),
                                description,
                                details);

                return savedTransaction;
        }

        // Từ chối phiếu nhập/xuất
        @Override
        public FeedTransaction rejectTransaction(
                        String transactionId,
                        String reviewedBy,
                        String reviewNote) {

                FeedTransaction transaction = getTransactionById(transactionId);

                if (!"PENDING".equals(transaction.getTransactionStatus())) {
                        throw new RuntimeException("Phiếu này đã được xử lý!");
                }

                // Không cho phép người tạo tự từ chối phiếu của mình.
                if (transaction.getCreatedBy() != null
                                && transaction.getCreatedBy().equalsIgnoreCase(reviewedBy)) {
                        throw new RuntimeException(
                                        "Người tạo phiếu không được tự từ chối phiếu!");
                }

                transaction.setTransactionStatus("REJECTED");
                transaction.setReviewedBy(reviewedBy);
                transaction.setReviewNote(reviewNote);
                transaction.setReviewedAt(LocalDateTime.now());

                FeedTransaction savedTransaction = transactionRepository.save(transaction);

                Map<String, Object> details = new LinkedHashMap<>();
                details.put("transactionId", savedTransaction.getId());
                details.put("feedId", savedTransaction.getFeedId());
                details.put("feedCode", savedTransaction.getFeedCode());
                details.put("feedName", savedTransaction.getFeedName());
                details.put("transactionType", savedTransaction.getTransactionType());
                details.put("quantity", savedTransaction.getQuantity());
                details.put("createdBy", savedTransaction.getCreatedBy());
                details.put("reviewedBy", reviewedBy);
                details.put("reviewNote", reviewNote);
                details.put("status", "REJECTED");

                // Phiếu bị từ chối không làm thay đổi tồn kho.
                auditLogService.createLog(
                                reviewedBy,
                                "FARM_MANAGER",
                                "REJECT_FEED_TRANSACTION",
                                "FEED_TRANSACTION",
                                savedTransaction.getId(),
                                "Đã từ chối phiếu nhập/xuất thức ăn "
                                                + savedTransaction.getFeedName() + ".",
                                details);

                return savedTransaction;
        }

        @Override
        public List<FeedTransaction> getAllTransactions() {
                return transactionRepository.findAllByOrderByTransactionDateDesc();
        }

        @Override
        public FeedTransaction getTransactionById(String id) {
                return transactionRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException(
                                                "Không tìm thấy phiếu nhập xuất!"));
        }

        @Override
        public List<FeedTransaction> getTransactionsByType(
                        String transactionType) {
                return transactionRepository
                                .findByTransactionTypeOrderByTransactionDateDesc(transactionType);
        }

        @Override
        public List<FeedTransaction> getTransactionsByStatus(
                        String transactionStatus) {
                return transactionRepository
                                .findByTransactionStatusOrderByTransactionDateDesc(transactionStatus);
        }

        @Override
        public List<FeedTransaction> getTransactionsByFeedId(String feedId) {
                return transactionRepository
                                .findByFeedIdOrderByTransactionDateDesc(feedId);
        }
}
