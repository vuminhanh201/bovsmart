
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.model.Feed;
import com.bovsmart.jwt.model.FeedCategory;
import com.bovsmart.jwt.repository.FeedRepository;
import com.bovsmart.jwt.repository.FeedCategoryRepository;
import com.bovsmart.jwt.service.FeedService;
import com.bovsmart.jwt.model.FeedTransaction;
import com.bovsmart.jwt.repository.FeedTransactionRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedServiceImpl implements FeedService {

    private final FeedRepository feedRepository;
    private final FeedCategoryRepository categoryRepository;
    private final FeedTransactionRepository transactionRepository;

    public FeedServiceImpl(
            FeedRepository feedRepository,
            FeedCategoryRepository categoryRepository,
            FeedTransactionRepository transactionRepository) {

        this.feedRepository = feedRepository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
    }

    // Thêm thức ăn mới
    @Override
    public Feed createFeed(Feed feed) {

        if (feed.getFeedCode() == null
                || feed.getFeedCode().trim().isEmpty()) {
            throw new RuntimeException("Mã thức ăn không được để trống!");
        }

        if (feed.getFeedName() == null
                || feed.getFeedName().trim().isEmpty()) {
            throw new RuntimeException("Tên thức ăn không được để trống!");
        }

        if (feedRepository.existsByFeedCode(feed.getFeedCode())) {
            throw new RuntimeException("Mã thức ăn đã tồn tại!");
        }

        if (feed.getQuantity() < 0
                || feed.getMinStock() < 0
                || feed.getUnitPrice() < 0) {
            throw new RuntimeException(
                    "Số lượng, tồn kho tối thiểu và đơn giá không được âm!");
        }

        if (feed.getCategoryId() == null
                || feed.getCategoryId().trim().isEmpty()) {
            throw new RuntimeException("Danh mục thức ăn không được để trống!");
        }

        FeedCategory category = categoryRepository.findById(feed.getCategoryId())
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy danh mục thức ăn!"));

        feed.setCategoryName(category.getCategoryName());

        if (feed.getUnit() == null
                || feed.getUnit().trim().isEmpty()) {
            throw new RuntimeException("Đơn vị tính không được để trống!");
        }

        if (feed.getStatus() == null
                || feed.getStatus().trim().isEmpty()) {
            feed.setStatus("ACTIVE");
        }

        return feedRepository.save(feed);
    }

    // Lấy toàn bộ thức ăn
    @Override
    public List<Feed> getAllFeeds() {
        return feedRepository.findAll();
    }

    // Lấy thức ăn theo ID
    @Override
    public Feed getFeedById(String id) {
        return feedRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy thức ăn!"));
    }

    // Cập nhật thông tin thức ăn, không cập nhật số lượng tồn kho
    @Override
    public Feed updateFeed(String id, Feed feed) {

        Feed existing = getFeedById(id);

        if (feed.getFeedName() == null
                || feed.getFeedName().trim().isEmpty()) {
            throw new RuntimeException("Tên thức ăn không được để trống!");
        }

        if (feed.getMinStock() < 0 || feed.getUnitPrice() < 0) {
            throw new RuntimeException(
                    "Tồn kho tối thiểu và đơn giá không được âm!");
        }

        if (feed.getCategoryId() != null
                && !feed.getCategoryId().trim().isEmpty()) {

            FeedCategory category = categoryRepository
                    .findById(feed.getCategoryId())
                    .orElseThrow(() ->
                            new RuntimeException("Không tìm thấy danh mục thức ăn!"));

            existing.setCategoryId(category.getId());
            existing.setCategoryName(category.getCategoryName());
        }

        if (feed.getUnit() == null || feed.getUnit().trim().isEmpty()) {
            throw new RuntimeException("Đơn vị tính không được để trống!");
        }

        existing.setFeedName(feed.getFeedName());
        existing.setUnit(feed.getUnit());

        // Không cho phép cập nhật quantity tại API sửa thông tin.
        // Tồn kho chỉ thay đổi qua phiếu nhập/xuất đã được duyệt.

        existing.setMinStock(feed.getMinStock());
        existing.setUnitPrice(feed.getUnitPrice());
        existing.setDescription(feed.getDescription());

        if (feed.getStatus() != null
                && !feed.getStatus().trim().isEmpty()) {
            existing.setStatus(feed.getStatus());
        }

        return feedRepository.save(existing);
    }

   // Xóa thức ăn an toàn, bảo toàn lịch sử nhập/xuất
    @Override
    public void deleteFeed(String id) {

        Feed feed = getFeedById(id);

        List<FeedTransaction> transactions =
                transactionRepository.findByFeedIdOrderByTransactionDateDesc(id);

        // Không cho xóa khi còn phiếu chờ xử lý
        boolean hasPendingTransaction = transactions.stream()
                .anyMatch(transaction ->
                        "PENDING".equalsIgnoreCase(
                                transaction.getTransactionStatus()));

        if (hasPendingTransaction) {
            throw new RuntimeException(
                    "Không thể xóa nguyên liệu vì vẫn còn phiếu nhập/xuất đang chờ duyệt!");
        }

        // Chưa có lịch sử giao dịch: xóa vật lý
        if (transactions.isEmpty()) {
            feedRepository.delete(feed);
            return;
        }

        // Đã có lịch sử: chuyển sang ngừng sử dụng
        feed.setStatus("INACTIVE");
        feedRepository.save(feed);
    }

    // Lấy thức ăn theo danh mục
    @Override
    public List<Feed> getFeedsByCategory(String categoryId) {
        return feedRepository.findByCategoryId(categoryId);
    }

    // Lấy thức ăn theo trạng thái
    @Override
    public List<Feed> getFeedsByStatus(String status) {
        return feedRepository.findByStatus(status);
    }

    // Lấy danh sách thức ăn tồn kho thấp
    @Override
    public List<Feed> getLowStockFeeds() {
        return feedRepository.findLowStockFeeds();
    }
}
