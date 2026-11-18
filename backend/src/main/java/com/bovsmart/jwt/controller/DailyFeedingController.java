
package com.bovsmart.jwt.controller;

import java.util.List;
import java.time.LocalDate;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bovsmart.jwt.dto.request.DailyRationRequestDTO;
import com.bovsmart.jwt.dto.request.FeedingShiftRecordRequestDTO;
import com.bovsmart.jwt.dto.request.FeedingShiftRecordReviewDTO;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.DailyRation;
import com.bovsmart.jwt.model.FeedingShiftRecord;
import com.bovsmart.jwt.model.FeedingShiftSchedule;
import com.bovsmart.jwt.service.DailyFeedingService;
import com.bovsmart.jwt.security.services.UserDetailsImpl;

@RestController
@RequestMapping("/api/feeding")
@CrossOrigin(origins = "*")
public class DailyFeedingController {

    private final DailyFeedingService dailyFeedingService;

    public DailyFeedingController(DailyFeedingService dailyFeedingService) {
        this.dailyFeedingService = dailyFeedingService;
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

    // ADMIN và FARM_MANAGER chỉ được xem nhật ký
    private void checkAdminOrManager(Authentication authentication) {
        boolean allowed = authentication.getAuthorities().stream()
                .anyMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN")
                        || a.getAuthority().equals("ROLE_FARM_MANAGER"));

        if (!allowed) {
                throw new AccessDeniedException(
                        "Bạn không có quyền xem nhật ký cho ăn!");
        }
        }

    // Lấy email tài khoản đang đăng nhập
    private String getAuthenticatedEmail(Authentication authentication) {
        if (authentication.getPrincipal() instanceof UserDetailsImpl userDetails) {
            return userDetails.getEmail();
        }

        throw new AccessDeniedException(
                "Không xác định được email tài khoản đăng nhập!");
    }

    // =====================================
    // 1. KHẨU PHẦN THEO NHÓM VÀ THỜI GIAN
    // =====================================

    // Quản lý tạo khẩu phần theo nhóm chuồng, ngày hoặc tuần
    @PostMapping("/daily-rations")
    public ResponseEntity<ResponseModel<List<DailyRation>>> createDailyRation(
            @RequestBody DailyRationRequestDTO request,
            Authentication authentication) {

        checkFarmManager(authentication);

        List<DailyRation> rations = dailyFeedingService.createDailyRation(
                request,
                getAuthenticatedEmail(authentication));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        rations,
                        "Tạo khẩu phần thành công! Lịch cho ăn được chia thành 2 ca: 06:00 và 18:00."));
    }

    // Quản lý xem toàn bộ khẩu phần ngày
    @GetMapping("/daily-rations")
    public ResponseEntity<ResponseModel<List<DailyRation>>> getAllDailyRations(
            Authentication authentication) {

        checkFarmManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                dailyFeedingService.getAllDailyRations(),
                "Lấy danh sách khẩu phần ngày thành công!"));
    }

    // =====================================
    // 2. LỊCH CHO ĂN THEO CA
    // =====================================

    // Quản lý xem toàn bộ lịch ca
    @GetMapping("/shift-schedules")
    public ResponseEntity<ResponseModel<List<FeedingShiftSchedule>>> getAllShiftSchedules(
            Authentication authentication) {

        checkFarmManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                dailyFeedingService.getAllShiftSchedules(),
                "Lấy toàn bộ lịch cho ăn theo ca thành công!"));
    }

    // Nhân viên xem lịch ca được giao
    @GetMapping("/my-shift-schedules")
    public ResponseEntity<ResponseModel<List<FeedingShiftSchedule>>> getMyShiftSchedules(
            Authentication authentication) {

        checkStaffOrManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                dailyFeedingService.getMyShiftSchedules(
                        getAuthenticatedEmail(authentication)),
                "Lấy lịch cho ăn theo ca được giao thành công!"));
    }

    // Xem lịch ca theo chuồng
    @GetMapping("/shift-schedules/barn/{barnId}")
    public ResponseEntity<ResponseModel<List<FeedingShiftSchedule>>> getShiftSchedulesByBarn(
            @PathVariable String barnId,
            Authentication authentication) {

        checkStaffOrManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                dailyFeedingService.getShiftSchedulesByBarn(barnId),
                "Lấy lịch cho ăn theo chuồng thành công!"));
    }

    // =====================================
    // 3. GHI NHẬN LƯỢNG THỨC ĂN THỰC TẾ
    // =====================================

    // Nhân viên ghi nhận lượng thực tế của từng loại thức ăn
    @PostMapping("/shift-records")
    public ResponseEntity<ResponseModel<FeedingShiftRecord>> createShiftRecord(
            @RequestBody FeedingShiftRecordRequestDTO request,
            Authentication authentication) {

        checkStaffOrManager(authentication);

        FeedingShiftRecord record = dailyFeedingService.createShiftRecord(
                request,
                getAuthenticatedEmail(authentication));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        record,
                        "Ghi nhận cho ăn theo ca thành công, đang chờ quản lý xác nhận!"));
    }

    // Quản lý xem toàn bộ phiếu ghi nhận
    @GetMapping("/shift-records")
    public ResponseEntity<ResponseModel<List<FeedingShiftRecord>>> getAllShiftRecords(
            Authentication authentication) {

        checkFarmManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                dailyFeedingService.getAllShiftRecords(),
                "Lấy danh sách phiếu cho ăn theo ca thành công!"));
    }

    // Nhân viên xem phiếu do mình thực hiện
    @GetMapping("/my-shift-records")
    public ResponseEntity<ResponseModel<List<FeedingShiftRecord>>> getMyShiftRecords(
            Authentication authentication) {

        checkStaffOrManager(authentication);

        return ResponseEntity.ok(ResponseModel.success(
                dailyFeedingService.getMyShiftRecords(
                        getAuthenticatedEmail(authentication)),
                "Lấy lịch sử cho ăn theo ca thành công!"));
    }

    // =====================================
    // 4. QUẢN LÝ DUYỆT PHIẾU
    // =====================================

    @PutMapping("/shift-records/{id}/approve")
    public ResponseEntity<ResponseModel<FeedingShiftRecord>> approveShiftRecord(
            @PathVariable String id,
            @RequestBody(required = false) FeedingShiftRecordReviewDTO request,
            Authentication authentication) {

        checkFarmManager(authentication);

        String reviewNote = request == null ? null : request.getReviewNote();

        FeedingShiftRecord record = dailyFeedingService.approveShiftRecord(
                id,
                getAuthenticatedEmail(authentication),
                reviewNote);

        return ResponseEntity.ok(ResponseModel.success(
                record,
                "Duyệt phiếu cho ăn thành công! Kho thức ăn đã được cập nhật."));
    }

    @PutMapping("/shift-records/{id}/reject")
    public ResponseEntity<ResponseModel<FeedingShiftRecord>> rejectShiftRecord(
            @PathVariable String id,
            @RequestBody(required = false) FeedingShiftRecordReviewDTO request,
            Authentication authentication) {

        checkFarmManager(authentication);

        String reviewNote = request == null ? null : request.getReviewNote();

        FeedingShiftRecord record = dailyFeedingService.rejectShiftRecord(
                id,
                getAuthenticatedEmail(authentication),
                reviewNote);

        return ResponseEntity.ok(ResponseModel.success(
                record,
                "Từ chối phiếu cho ăn theo ca thành công!"));
    }

    // =====================================
    // 5. NHẬT KÝ CHO ĂN
    // =====================================

    @GetMapping("/diary")
        public ResponseEntity<ResponseModel<List<FeedingShiftRecord>>> getFeedingDiary(
                @RequestParam(required = false) String barnId,
                @RequestParam(required = false) String fromDate,
                @RequestParam(required = false) String toDate,
                @RequestParam(required = false) String keyword,
                Authentication authentication) {

        checkAdminOrManager(authentication);

        LocalDate startDate = fromDate == null || fromDate.isBlank()
                ? null : LocalDate.parse(fromDate);

        LocalDate endDate = toDate == null || toDate.isBlank()
                ? null : LocalDate.parse(toDate);

        List<FeedingShiftRecord> records =
                dailyFeedingService.getApprovedFeedingDiary(
                        barnId,
                        startDate,
                        endDate,
                        keyword
                );

        return ResponseEntity.ok(ResponseModel.success(
                records,
                "Lấy nhật ký cho ăn thành công!"));
        }
}
