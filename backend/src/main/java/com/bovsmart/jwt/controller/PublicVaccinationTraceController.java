
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.VaccinationRecord;
import com.bovsmart.jwt.repository.VaccinationRecordRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/public/trace")
public class PublicVaccinationTraceController {

    private final VaccinationRecordRepository vaccinationRepository;

    public PublicVaccinationTraceController(
            VaccinationRecordRepository vaccinationRepository) {
        this.vaccinationRepository = vaccinationRepository;
    }

    // Lịch sử tiêm phòng công khai qua mã QR
    @GetMapping("/{cattleId}/vaccinations")
    public ResponseEntity<ResponseModel<List<Map<String, Object>>>> getPublicVaccinations(
            @PathVariable String cattleId) {

        List<VaccinationRecord> records =
                vaccinationRepository.findByCattleIdOrderByCreatedAtDesc(cattleId);

        List<Map<String, Object>> publicRecords = records.stream()
                .map(record -> {
                    Map<String, Object> item = new LinkedHashMap<>();

                    item.put("vaccineName", record.getVaccineName());
                    item.put("vaccineType", record.getVaccineType());
                    item.put("vaccinationDate", record.getVaccinationDate());
                    item.put("nextVaccinationDate", record.getNextVaccinationDate());
                    item.put("batchNumber", record.getBatchNumber());
                    item.put("manufacturer", record.getManufacturer());

                    return item;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(
                ResponseModel.success(
                        publicRecords,
                        "Lấy lịch sử tiêm phòng công khai thành công!"
                )
        );
    }
}
