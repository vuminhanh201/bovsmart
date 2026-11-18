
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.HealthRecord;
import com.bovsmart.jwt.service.HealthService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/public/trace")
public class PublicHealthTraceController {

    private final HealthService healthService;

    public PublicHealthTraceController(HealthService healthService) {
        this.healthService = healthService;
    }

    // Lịch sử sức khỏe công khai qua mã QR
    @GetMapping("/{cattleId}/health")
    public ResponseEntity<ResponseModel<List<Map<String, Object>>>> getPublicHealthHistory(
            @PathVariable String cattleId) {

        List<HealthRecord> records =
                healthService.getHealthRecordsByCattleId(cattleId);

        List<Map<String, Object>> publicRecords = records.stream()

                // Chỉ hiển thị hồ sơ đã được thú y và quản lý xác nhận
                .filter(record ->
                        record.getVetReviewedAt() != null
                        && record.getManagerConfirmedAt() != null
                )

                // Hồ sơ mới nhất hiển thị trước
                .sorted(
                        Comparator.comparing(
                                HealthRecord::getCreatedAt,
                                Comparator.nullsLast(Comparator.reverseOrder())
                        )
                )

                .map(record -> {
                    Map<String, Object> item = new LinkedHashMap<>();

                    item.put("examinationDate", record.getExaminationDate());
                    item.put("diagnosis", record.getDiagnosis());
                    item.put("treatment", record.getTreatment());
                    item.put("medicine", record.getMedicine());

                    item.put("treatmentStartDate", record.getTreatmentStartDate());
                    item.put("treatmentEndDate", record.getTreatmentEndDate());
                    item.put("followUpDate", record.getFollowUpDate());

                    item.put("withdrawalPeriodDays", record.getWithdrawalPeriodDays());
                    item.put("withdrawalEndDate", record.getWithdrawalEndDate());
                    item.put("withdrawalStatus", record.getWithdrawalStatus());

                    item.put("recordStatus", record.getRecordStatus());
                    item.put("vetReviewedAt", record.getVetReviewedAt());
                    item.put("managerConfirmedAt", record.getManagerConfirmedAt());

                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                ResponseModel.success(
                        publicRecords,
                        "Lấy lịch sử sức khỏe công khai thành công!"
                )
        );
    }
}
