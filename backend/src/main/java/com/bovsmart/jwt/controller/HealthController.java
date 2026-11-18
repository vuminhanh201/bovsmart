
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.HealthRecordRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.HealthRecord;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.HealthService;
import com.bovsmart.jwt.dto.response.VeterinaryStaffOption;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/health")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    // 0. FARM_MANAGER lấy danh sách nhân viên thú y
    @GetMapping("/veterinarians")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<VeterinaryStaffOption>> getAvailableVeterinarians() {

        return ResponseModel.success(
                healthService.getAvailableVeterinarians(),
                "Lấy danh sách nhân viên thú y thành công!"
        );
        }
    
    // 1. STAFF hoặc FARM_MANAGER ghi nhận hồ sơ sức khỏe
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HealthRecord>> createHealthRecord(
            @RequestBody HealthRecordRequest request,
            Authentication authentication) {

        try {
            UserDetailsImpl currentUser =
                    (UserDetailsImpl) authentication.getPrincipal();

            HealthRecord result = healthService.createHealthRecord(
                    request,
                    currentUser
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ResponseModel.success(
                            result,
                            "Ghi nhận hồ sơ sức khỏe thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ResponseModel.error(e.getMessage())
            );
        }

    }

    // 1.1 FARM_MANAGER phân công nhân viên thú y
    @PutMapping("/{id}/assign-vet")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HealthRecord>> assignVeterinarian(
                @PathVariable String id,
                @RequestBody Map<String, String> request,
                Authentication authentication) {

        try {
                UserDetailsImpl currentUser =
                        (UserDetailsImpl) authentication.getPrincipal();

                HealthRecord result = healthService.assignVeterinarian(
                        id,
                        request.get("vetId"),
                        currentUser
                );

                return ResponseEntity.ok(
                        ResponseModel.success(
                                result,
                                "Phân công nhân viên thú y thành công!"
                        )
                );

        } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ResponseModel.error(e.getMessage())
                );
        }
        }

    // 2. Thú y cập nhật hồ sơ đã được nhân viên chăm sóc ghi nhận
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ResponseModel<HealthRecord>> updateHealthRecord(
            @PathVariable String id,
            @RequestBody HealthRecordRequest request,
            Authentication authentication) {

        try {
            UserDetailsImpl currentUser =
                    (UserDetailsImpl) authentication.getPrincipal();

            HealthRecord result = healthService.updateHealthRecord(
                    id,
                    request,
                    currentUser
            );

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Thú y cập nhật hồ sơ sức khỏe thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 2.1 STAFF thuộc bộ phận Thú y xem hồ sơ được phân công
    @GetMapping("/my-assigned")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ResponseModel<List<HealthRecord>>> getAssignedHealthRecords(
                Authentication authentication) {

        try {
                UserDetailsImpl currentUser =
                        (UserDetailsImpl) authentication.getPrincipal();

                List<HealthRecord> result =
                        healthService.getAssignedHealthRecords(currentUser);

                return ResponseEntity.ok(
                        ResponseModel.success(
                                result,
                                "Lấy danh sách hồ sơ được phân công thành công!"
                        )
                );

        } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ResponseModel.error(e.getMessage())
                );
        }
        }

    // 3. Lấy toàn bộ hồ sơ sức khỏe
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER')")
    public ResponseModel<List<HealthRecord>> getAllHealthRecords() {
        return ResponseModel.success(
                healthService.getAllHealthRecords(),
                "Lấy danh sách hồ sơ sức khỏe thành công!"
        );
    }

    // 4. Lấy hồ sơ sức khỏe theo bò
    @GetMapping("/cattle/{cattleId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<List<HealthRecord>>> getHealthRecordsByCattleId(
            @PathVariable String cattleId) {

        try {
            List<HealthRecord> result =
                    healthService.getHealthRecordsByCattleId(cattleId);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Lấy lịch sử sức khỏe của bò thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 5. Lấy chi tiết hồ sơ sức khỏe
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HealthRecord>> getHealthRecordById(
            @PathVariable String id) {

        try {
            HealthRecord result = healthService.getHealthRecordById(id);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Lấy chi tiết hồ sơ sức khỏe thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 6. FARM_MANAGER xác nhận tình trạng ngừng thuốc
    @PutMapping("/{id}/withdrawal-status")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HealthRecord>> confirmWithdrawalStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {

        try {
            HealthRecord result = healthService.confirmWithdrawalStatus(
                    id,
                    request.get("withdrawalStatus"),
                    authentication.getName()
            );

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Xác nhận tình trạng ngừng thuốc thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }
}
