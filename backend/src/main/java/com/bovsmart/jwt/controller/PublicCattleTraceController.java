
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.WeightRecord;
import com.bovsmart.jwt.service.CattleService;
import com.bovsmart.jwt.dto.response.ResponseModel;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/public/trace")
public class PublicCattleTraceController {

    private final CattleService cattleService;

    public PublicCattleTraceController(CattleService cattleService) {
        this.cattleService = cattleService;
    }

    // Tra cứu thông tin bò bằng mã QR
    @GetMapping("/{id}")
    public ResponseEntity<ResponseModel<Map<String, Object>>> getPublicCattleTrace(
            @PathVariable String id) {

        return cattleService.getCattleById(id)
                .map(cattle -> {
                    Map<String, Object> data = new LinkedHashMap<>();

                    // Thông tin cơ bản được phép công khai
                    data.put("id", cattle.getId());
                    data.put("name", cattle.getName());
                    data.put("earTagNumber", cattle.getEarTagNumber());
                    data.put("breed", cattle.getBreed());
                    data.put("gender", cattle.getGender());
                    data.put("origin", cattle.getOrigin());
                    data.put("entryDate", cattle.getEntryDate());
                    data.put("weight", cattle.getWeight());
                    data.put("status", cattle.getStatus());

                    // Chỉ công khai ngày cân và cân nặng.
                    // Không công khai người ghi nhận hoặc ghi chú nội bộ.
                    List<Map<String, Object>> publicWeightHistory =
                            new ArrayList<>();

                    if (cattle.getWeightHistory() != null) {
                        for (WeightRecord record : cattle.getWeightHistory()) {
                            Map<String, Object> weightData =
                                    new LinkedHashMap<>();

                            weightData.put("date", record.getDate());
                            weightData.put("weight", record.getWeight());

                            publicWeightHistory.add(weightData);
                        }
                    }

                    data.put("weightHistory", publicWeightHistory);

                    return ResponseEntity.ok(
                            ResponseModel.success(
                                    data,
                                    "Tra cứu thông tin bò thành công!"
                            )
                    );
                })
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                                ResponseModel.error("Không tìm thấy hồ sơ bò!")
                        )
                );
    }
}
