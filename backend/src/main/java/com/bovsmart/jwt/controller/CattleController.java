
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.service.CattleService;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.dto.response.SaleEligibilityResponse;
import com.bovsmart.jwt.dto.request.WeightRecordRequest;
import com.bovsmart.jwt.dto.request.RfidScanRequest;

import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/cattle")
public class CattleController {

    private final CattleService cattleService;

    public CattleController(CattleService cattleService) {
        this.cattleService = cattleService;
    }

    // 1. Thêm bò
    @PostMapping
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<Cattle>> createCattle(
                @RequestBody Cattle cattle,
                Authentication authentication) {

        try {
                String createdBy = authentication.getName();

                Cattle result = cattleService.createCattle(
                        cattle,
                        createdBy,
                        "FARM_MANAGER"
                );

                return ResponseEntity.status(HttpStatus.CREATED).body(
                        ResponseModel.success(result, "Thêm bò thành công!")
                );

        } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ResponseModel.error(e.getMessage())
                );

        } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ResponseModel.error(e.getMessage())
                );
        }
    }

    // 2. Lấy danh sách bò
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    @GetMapping
    public ResponseModel<List<Cattle>> getAllCattle() {

        List<Cattle> cattleList = cattleService.getAllCattle();

        return ResponseModel.success(
                cattleList,
                "Lấy danh sách bò thành công!"
        );
    }

    // 3. Lấy chi tiết bò
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    @GetMapping("/{id}")
    public ResponseEntity<ResponseModel<Cattle>> getCattleById(
            @PathVariable String id) {

        return cattleService.getCattleById(id)
                .map(cattle -> ResponseEntity.ok(
                        ResponseModel.success(
                                cattle,
                                "Lấy thông tin bò thành công!"
                        )
                ))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ResponseModel.error("Không tìm thấy bò!")
                ));
    }

    
    // 4. Cập nhật bò
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<Cattle>> updateCattle(
                @PathVariable String id,
                @RequestBody Cattle cattle,
                Authentication authentication) {

        try {
                String updatedBy = authentication.getName();

                Cattle result = cattleService.updateCattle(
                        id,
                        cattle,
                        updatedBy,
                        "FARM_MANAGER"
                );

                return ResponseEntity.ok(
                        ResponseModel.success(
                                result,
                                "Cập nhật thông tin bò thành công!"
                        )
                );

        } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ResponseModel.error(e.getMessage())
                );

        } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ResponseModel.error(e.getMessage())
                );
        }
    }


    // 5. Xóa bò
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<String>> deleteCattle(
            @PathVariable String id) {

        try {
            cattleService.deleteCattle(id);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            null,
                            "Xóa bò thành công!"
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 6. Tìm kiếm và lọc hồ sơ bò
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    @GetMapping("/search")
    public ResponseModel<List<Cattle>> searchCattle(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String penId) {

        List<Cattle> result = cattleService.searchCattle(
                keyword,
                status,
                penId
        );

        return ResponseModel.success(
                result,
                "Tìm kiếm hồ sơ bò thành công!"
        );
    }

    // 7. Ghi nhận lịch sử cân mới
   @PostMapping("/{id}/weight-history")
   @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
   public ResponseEntity<ResponseModel<Cattle>> recordWeight(
            @PathVariable String id,
            @RequestBody WeightRecordRequest request,
            Authentication authentication) {

        try {
            String recordedBy = authentication != null
                ? authentication.getName()
                : "SYSTEM";

            String role = authentication != null
                ? authentication.getAuthorities().stream()
                        .map(authority -> authority.getAuthority().replace("ROLE_", ""))
                        .filter(r -> r.equals("STAFF") || r.equals("FARM_MANAGER"))
                        .findFirst()
                        .orElse("UNKNOWN")
                : "UNKNOWN";

            Cattle result = cattleService.recordWeight(id, request, recordedBy, role);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Ghi nhận lịch sử cân thành công!"
                    )
            );

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ResponseModel.error(e.getMessage())
            );

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 8. Lấy danh sách bò đủ điều kiện xuất bán
    @GetMapping("/sale-eligibility")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseModel<List<SaleEligibilityResponse>> getEligibleCattleForSale() {

        List<SaleEligibilityResponse> result =
                cattleService.getEligibleCattleForSale();

        return ResponseModel.success(
                result,
                "Lấy danh sách bò đủ điều kiện xuất bán thành công!"
        );
    }

    // 9. Kiểm tra điều kiện xuất bán của một con bò
   @GetMapping("/{id}/sale-eligibility")
   @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<SaleEligibilityResponse>> checkSaleEligibility(
            @PathVariable String id) {

        try {
            SaleEligibilityResponse result =
                    cattleService.checkSaleEligibility(id);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Kiểm tra điều kiện xuất bán thành công!"
                    )
            );

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 10. FARM_MANAGER xác nhận bò đủ điều kiện xuất bán
   @PutMapping("/{id}/confirm-sale-eligibility")
   @PreAuthorize("hasRole('FARM_MANAGER')")
   public ResponseEntity<ResponseModel<SaleEligibilityResponse>> confirmSaleEligibility(
            @PathVariable String id,
            Authentication authentication) {
        try {
                String confirmedBy = authentication.getName();

                SaleEligibilityResponse result =
                        cattleService.confirmSaleEligibility(id, confirmedBy);

                return ResponseEntity.ok(
                        ResponseModel.success(result, "Xác nhận đủ điều kiện xuất bán thành công!")
                );
        } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ResponseModel.error(e.getMessage()));
        }
   }

    // 11. Mô phỏng quét RFID và nhận diện bò
    @PostMapping("/rfid/scan")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<Cattle>> scanRfid(
                @RequestBody RfidScanRequest request) {

        try {
                if (request.getRfidTag() == null
                        || request.getRfidTag().isBlank()) {

                    return ResponseEntity.badRequest().body(
                       ResponseModel.error("Mã RFID không được để trống!")
                );
             }

             return cattleService.getCattleByRfidTag(request.getRfidTag())
                .map(cattle -> ResponseEntity.ok(
                        ResponseModel.success(
                                cattle,
                                "Quét RFID thành công! Đã nhận diện được bò."
                        )
                ))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ResponseModel.error(
                                "Không nhận diện được bò! Mã RFID không tồn tại."
                        )
                ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                ResponseModel.error(e.getMessage())
            );
        }
    }
}
