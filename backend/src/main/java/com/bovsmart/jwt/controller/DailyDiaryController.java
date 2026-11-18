
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.DailyDiaryRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.DailyDiary;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.DailyDiaryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/daily-diaries")
public class DailyDiaryController {

    private final DailyDiaryService diaryService;

    public DailyDiaryController(DailyDiaryService diaryService) {
        this.diaryService = diaryService;
    }

    // STAFF và FARM_MANAGER tạo nhật ký hằng ngày
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<DailyDiary>> createDiary(
            @RequestBody DailyDiaryRequest request,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails =
                    (UserDetailsImpl) authentication.getPrincipal();

            DailyDiary result = diaryService.createDiary(
                    request, userDetails.getId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseModel.success(
                            result, "Thêm nhật ký hằng ngày thành công!"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // FARM_MANAGER và ADMIN xem toàn bộ nhật ký
    @GetMapping
    @PreAuthorize("hasAnyRole('FARM_MANAGER', 'ADMIN')")
    public ResponseModel<List<DailyDiary>> getAllDiaries() {
        return ResponseModel.success(
                diaryService.getAllDiaries(),
                "Lấy danh sách nhật ký hằng ngày thành công!");
    }

    // STAFF xem nhật ký của mình
    @GetMapping("/my-diaries")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseModel<List<DailyDiary>> getMyDiaries(
            Authentication authentication) {

        UserDetailsImpl userDetails =
                (UserDetailsImpl) authentication.getPrincipal();

        return ResponseModel.success(
                diaryService.getMyDiaries(userDetails.getId()),
                "Lấy nhật ký của tôi thành công!");
    }

    // FARM_MANAGER và ADMIN xem chi tiết nhật ký
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FARM_MANAGER', 'ADMIN')")
    public ResponseEntity<ResponseModel<DailyDiary>> getDiaryById(
            @PathVariable String id) {
        try {
            return ResponseEntity.ok(ResponseModel.success(
                    diaryService.getDiaryById(id),
                    "Lấy chi tiết nhật ký thành công!"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // FARM_MANAGER xác nhận nhật ký
    @PutMapping("/{id}/verify")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<DailyDiary>> verifyDiary(
            @PathVariable String id,
            Authentication authentication) {
        try {
            DailyDiary result = diaryService.verifyDiary(
                    id, authentication.getName());

            return ResponseEntity.ok(ResponseModel.success(
                    result, "Xác nhận nhật ký thành công!"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }
}
