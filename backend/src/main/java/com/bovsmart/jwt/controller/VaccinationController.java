
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.VaccinationRecordRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.VaccinationRecord;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.VaccinationService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/vaccinations")
public class VaccinationController {

    private final VaccinationService vaccinationService;

    public VaccinationController(VaccinationService vaccinationService) {
        this.vaccinationService = vaccinationService;
    }

    // STAFF phòng ban Thú y và FARM_MANAGER được ghi nhận tiêm phòng
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<VaccinationRecord>> createVaccinationRecord(
                @RequestBody VaccinationRecordRequest request,
                Authentication authentication) {
        try {
                UserDetailsImpl currentUser =
                        (UserDetailsImpl) authentication.getPrincipal();

                VaccinationRecord result =
                        vaccinationService.createVaccinationRecord(request, currentUser);

                return ResponseEntity.ok(
                        ResponseModel.success(
                                result,
                                "Ghi nhận tiêm phòng thành công"
                        )
                );

        } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ResponseModel.error(e.getMessage()));
        }
        }

    // Chỉ FARM_MANAGER được xem toàn bộ hồ sơ tiêm phòng
    @GetMapping
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<VaccinationRecord>> getAllVaccinationRecords() {
        return ResponseModel.success(
                vaccinationService.getAllVaccinationRecords(),
                "Lấy danh sách hồ sơ tiêm phòng thành công!"
        );
    }

    // Lịch tiêm sắp đến hạn trong 7 ngày
    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<VaccinationRecord>> getUpcomingVaccinations() {
        return ResponseModel.success(
                vaccinationService.getUpcomingVaccinations(),
                "Lấy danh sách lịch tiêm sắp đến hạn thành công!"
        );
    }

    // Lịch tiêm đã quá hạn
    @GetMapping("/overdue")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<VaccinationRecord>> getOverdueVaccinations() {
        return ResponseModel.success(
                vaccinationService.getOverdueVaccinations(),
                "Lấy danh sách lịch tiêm quá hạn thành công!"
        );
    }

    // Tất cả lịch tiêm cần theo dõi
    @GetMapping("/attention")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<VaccinationRecord>> getVaccinationsNeedingAttention() {
        return ResponseModel.success(
                vaccinationService.getVaccinationsNeedingAttention(),
                "Lấy danh sách lịch tiêm cần theo dõi thành công!"
        );
    }

    // STAFF và FARM_MANAGER được xem lịch sử tiêm phòng theo bò
    @GetMapping("/cattle/{cattleId}")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<List<VaccinationRecord>>> getVaccinationRecordsByCattleId(
            @PathVariable String cattleId) {
        try {
            List<VaccinationRecord> result =
                    vaccinationService.getVaccinationRecordsByCattleId(cattleId);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Lấy lịch sử tiêm phòng của bò thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // STAFF và FARM_MANAGER được xem chi tiết hồ sơ tiêm phòng
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<VaccinationRecord>> getVaccinationRecordById(
            @PathVariable String id) {
        try {
            VaccinationRecord result =
                    vaccinationService.getVaccinationRecordById(id);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Lấy chi tiết hồ sơ tiêm phòng thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }
}
