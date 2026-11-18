
package com.bovsmart.jwt.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bovsmart.jwt.dto.request.FeedingScheduleRequestDTO;
import com.bovsmart.jwt.dto.request.FeedingRecordRequestDTO;
import com.bovsmart.jwt.dto.request.FeedingRecordReviewDTO;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.FeedingSchedule;
import com.bovsmart.jwt.model.FeedingRecord;
import com.bovsmart.jwt.service.FeedingService;

@RestController
@RequestMapping("/api/feeding")
@CrossOrigin(origins = "*")
public class FeedingController {

    private final FeedingService feedingService;

    public FeedingController(FeedingService feedingService) {
        this.feedingService = feedingService;
    }

    // STAFF hoặc FARM_MANAGER
    private void checkStaffOrManager(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_STAFF")
                        || a.getAuthority().equals("ROLE_FARM_MANAGER"));

        if (!allowed) {
            throw new AccessDeniedException(
                    "Bạn không có quyền thực hiện nghiệp vụ cho ăn!");
        }
    }

    // Chỉ FARM_MANAGER
    private void checkFarmManager(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_FARM_MANAGER"));

        if (!allowed) {
            throw new AccessDeniedException(
                    "Chỉ quản lý trang trại mới được thực hiện thao tác này!");
        }
    }

    // Tạo lịch cho ăn
    @PostMapping("/schedules")
    public ResponseEntity<ResponseModel<FeedingSchedule>> createSchedule(
            @RequestBody FeedingScheduleRequestDTO request,
            Authentication authentication) {

        checkFarmManager(authentication);

        FeedingSchedule schedule = feedingService.createSchedule(
                request.getFeedId(),
                request.getPlannedQuantity(),
                request.getBarnId(),
                request.getAssignedTo(),
                request.getFeedingDate(),
                request.getFeedingTime(),
                request.getNote(),
                authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        schedule,
                        "Tạo lịch cho ăn thành công!"));
    }

    // Lấy toàn bộ lịch - quản lý
    @GetMapping("/schedules")
    public ResponseEntity<ResponseModel<List<FeedingSchedule>>> getAllSchedules(
            Authentication authentication) {

        checkFarmManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                feedingService.getAllSchedules(),
                "Lấy danh sách lịch cho ăn thành công!"));
    }

    // STAFF xem lịch được giao
    @GetMapping("/my-schedules")
    public ResponseEntity<ResponseModel<List<FeedingSchedule>>> getMySchedules(
            Authentication authentication) {

        checkStaffOrManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                feedingService.getSchedulesByAssignedTo(authentication.getName()),
                "Lấy lịch cho ăn được phân công thành công!"));
    }

    // Lấy lịch theo chuồng
    @GetMapping("/schedules/barn/{barnId}")
    public ResponseEntity<ResponseModel<List<FeedingSchedule>>> getSchedulesByBarn(
            @PathVariable String barnId,
            Authentication authentication) {

        checkStaffOrManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                feedingService.getSchedulesByBarn(barnId),
                "Lấy lịch cho ăn theo chuồng thành công!"));
    }

    // STAFF ghi nhận lượng thức ăn thực tế
    @PostMapping("/records")
    public ResponseEntity<ResponseModel<FeedingRecord>> createRecord(
            @RequestBody FeedingRecordRequestDTO request,
            Authentication authentication) {

        checkStaffOrManager(authentication);

        FeedingRecord record = feedingService.createFeedingRecord(
                request.getScheduleId(),
                request.getActualQuantity(),
                request.getNote(),
                authentication.getName());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        record,
                        "Ghi nhận cho ăn thành công, đang chờ quản lý xác nhận!"));
    }

    // Quản lý xem toàn bộ phiếu ghi nhận
    @GetMapping("/records")
    public ResponseEntity<ResponseModel<List<FeedingRecord>>> getAllRecords(
            Authentication authentication) {

        checkFarmManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                feedingService.getAllRecords(),
                "Lấy danh sách phiếu cho ăn thành công!"));
    }

    // STAFF xem phiếu do mình thực hiện
    @GetMapping("/my-records")
    public ResponseEntity<ResponseModel<List<FeedingRecord>>> getMyRecords(
            Authentication authentication) {

        checkStaffOrManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                feedingService.getRecordsByPerformedBy(authentication.getName()),
                "Lấy lịch sử cho ăn thành công!"));
    }

    // Quản lý duyệt phiếu
    @PutMapping("/records/{id}/approve")
    public ResponseEntity<ResponseModel<FeedingRecord>> approveRecord(
            @PathVariable String id,
            @RequestBody(required = false) FeedingRecordReviewDTO request,
            Authentication authentication) {

        checkFarmManager(authentication);

        String reviewNote = request == null ? null : request.getReviewNote();

        FeedingRecord record = feedingService.approveRecord(
                id,
                authentication.getName(),
                reviewNote);

        return ResponseEntity.ok(ResponseModel.success(
                record,
                "Duyệt phiếu cho ăn thành công! Kho thức ăn đã được cập nhật."));
    }

    // Quản lý từ chối phiếu
    @PutMapping("/records/{id}/reject")
    public ResponseEntity<ResponseModel<FeedingRecord>> rejectRecord(
            @PathVariable String id,
            @RequestBody(required = false) FeedingRecordReviewDTO request,
            Authentication authentication) {

        checkFarmManager(authentication);

        String reviewNote = request == null ? null : request.getReviewNote();

        FeedingRecord record = feedingService.rejectRecord(
                id,
                authentication.getName(),
                reviewNote);

        return ResponseEntity.ok(ResponseModel.success(
                record,
                "Từ chối phiếu cho ăn thành công!"));
    }
}
