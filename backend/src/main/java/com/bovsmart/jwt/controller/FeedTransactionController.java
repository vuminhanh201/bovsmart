
package com.bovsmart.jwt.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bovsmart.jwt.dto.request.FeedTransactionRequestDTO;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.FeedTransaction;
import com.bovsmart.jwt.service.FeedTransactionService;

@RestController
@RequestMapping("/api/feed-transactions")
@CrossOrigin(origins = "*")
public class FeedTransactionController {

    private final FeedTransactionService transactionService;

    public FeedTransactionController(
            FeedTransactionService transactionService) {
        this.transactionService = transactionService;
    }

    // ADMIN, FARM_MANAGER, STAFF được xem dữ liệu.
    private void checkReadAccess(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
        throw new AccessDeniedException(
                "Bạn chưa được xác thực!");
        }

        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_FARM_MANAGER")
                        || a.getAuthority().equals("ROLE_STAFF"));

        if (!allowed) {
            throw new AccessDeniedException(
                    "Bạn không có quyền xem lịch sử nhập xuất!");
        }
    }

    // STAFF và FARM_MANAGER được tạo phiếu.
    private void checkCreateAccess(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException(
                    "Bạn chưa được xác thực!");
        }

        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_STAFF")
                        || a.getAuthority().equals("ROLE_FARM_MANAGER"));

        if (!allowed) {
            throw new AccessDeniedException(
                    "Bạn không có quyền tạo phiếu nhập xuất!");
        }
    }

    // Chỉ FARM_MANAGER được duyệt hoặc từ chối.
    private void checkFarmManager(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException(
                    "Bạn chưa được xác thực!");
        }

        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_FARM_MANAGER"));

        if (!allowed) {
            throw new AccessDeniedException(
                    "Chỉ quản lý trang trại mới được xác nhận phiếu!");
        }
    }

    // Tạo phiếu nhập hoặc xuất.
    @PostMapping
    public ResponseEntity<ResponseModel<FeedTransaction>> createTransaction(
            @RequestBody FeedTransactionRequestDTO request,
            Authentication authentication) {

        checkCreateAccess(authentication);

        FeedTransaction transaction = transactionService.createTransaction(
                request.getFeedId(),
                request.getTransactionType(),
                request.getQuantity(),
                request.getUnitPrice(),
                request.getNote(),
                authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        transaction,
                        "Tạo phiếu nhập xuất kho thành công!"));
    }

    // Duyệt phiếu.
    @PutMapping("/{id}/approve")
    public ResponseEntity<ResponseModel<FeedTransaction>> approveTransaction(
            @PathVariable String id,
            @RequestParam(required = false) String reviewNote,
            Authentication authentication) {

        checkFarmManager(authentication);

        FeedTransaction transaction = transactionService.approveTransaction(
                id,
                authentication.getName(),
                reviewNote);

        return ResponseEntity.ok(ResponseModel.success(
                transaction,
                "Xác nhận phiếu thành công!"));
    }

    // Từ chối phiếu.
    @PutMapping("/{id}/reject")
    public ResponseEntity<ResponseModel<FeedTransaction>> rejectTransaction(
            @PathVariable String id,
            @RequestParam(required = false) String reviewNote,
            Authentication authentication) {

        checkFarmManager(authentication);

        FeedTransaction transaction = transactionService.rejectTransaction(
                id,
                authentication.getName(),
                reviewNote);

        return ResponseEntity.ok(ResponseModel.success(
                transaction,
                "Từ chối phiếu thành công!"));
    }

    // Lấy toàn bộ lịch sử.
    @GetMapping
    public ResponseEntity<ResponseModel<List<FeedTransaction>>> getAllTransactions(
            Authentication authentication) {

        checkReadAccess(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                transactionService.getAllTransactions(),
                "Lấy lịch sử nhập xuất thành công!"));
    }

    // Lấy chi tiết phiếu.
    @GetMapping("/{id}")
    public ResponseEntity<ResponseModel<FeedTransaction>> getTransactionById(
            @PathVariable String id,
            Authentication authentication) {

        checkReadAccess(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                transactionService.getTransactionById(id),
                "Lấy chi tiết phiếu thành công!"));
    }

    // Lọc theo loại giao dịch.
    @GetMapping("/type/{type}")
    public ResponseEntity<ResponseModel<List<FeedTransaction>>> getByType(
            @PathVariable String type,
            Authentication authentication) {

        checkReadAccess(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                transactionService.getTransactionsByType(type),
                "Lấy phiếu theo loại thành công!"));
    }

    // Lọc theo trạng thái.
    @GetMapping("/status/{status}")
    public ResponseEntity<ResponseModel<List<FeedTransaction>>> getByStatus(
            @PathVariable String status,
            Authentication authentication) {

        checkReadAccess(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                transactionService.getTransactionsByStatus(status),
                "Lấy phiếu theo trạng thái thành công!"));
    }

    // Lịch sử theo thức ăn.
    @GetMapping("/feed/{feedId}")
    public ResponseEntity<ResponseModel<List<FeedTransaction>>> getByFeed(
            @PathVariable String feedId,
            Authentication authentication) {

        checkReadAccess(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                transactionService.getTransactionsByFeedId(feedId),
                "Lấy lịch sử thức ăn thành công!"));
    }
}
