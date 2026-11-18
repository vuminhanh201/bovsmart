package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.model.Barn;
import com.bovsmart.jwt.model.BarnCapacityCheck;
import com.bovsmart.jwt.model.CattleTransfer;
import com.bovsmart.jwt.model.BarnCleaningLog;
import com.bovsmart.jwt.dto.request.CattleTransferRequest;
import com.bovsmart.jwt.dto.request.BarnCleaningRequest;
import com.bovsmart.jwt.service.BarnService;
import com.bovsmart.jwt.dto.response.ResponseModel;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/barns")
public class BarnController {

    private final BarnService barnService;

    public BarnController(BarnService barnService) {
        this.barnService = barnService;
    }

    // 1. Thêm chuồng
    @PostMapping
    public ResponseEntity<ResponseModel<Barn>> createBarn(
            @RequestBody Barn barn) {
        try {
            Barn result = barnService.createBarn(barn);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ResponseModel.success(result, "Thêm chuồng thành công!")
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 2. Xem danh sách chuồng
    @GetMapping
    public ResponseEntity<ResponseModel<List<Barn>>> getAllBarns() {
        return ResponseEntity.ok(
                ResponseModel.success(
                        barnService.getAllBarns(),
                        "Lấy danh sách chuồng thành công!"
                )
        );
    }

    // 3. Xem chi tiết chuồng
    @GetMapping("/{id}")
    public ResponseEntity<ResponseModel<Barn>> getBarnById(
            @PathVariable String id) {
        return barnService.getBarnById(id)
                .map(barn -> ResponseEntity.ok(
                        ResponseModel.success(
                                barn,
                                "Lấy thông tin chuồng thành công!"
                        )
                ))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        ResponseModel.error("Không tìm thấy chuồng có ID: " + id)
                ));
    }

    // 4. Cập nhật chuồng
    @PutMapping("/{id}")
    public ResponseEntity<ResponseModel<Barn>> updateBarn(
            @PathVariable String id,
            @RequestBody Barn barn) {
        try {
            Barn result = barnService.updateBarn(id, barn);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result,
                            "Cập nhật chuồng thành công!"
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage())
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 5. Xóa chuồng
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseModel<Void>> deleteBarn(
            @PathVariable String id) {
        try {
            barnService.deleteBarn(id);

            return ResponseEntity.ok(
                    ResponseModel.success(null, "Xóa chuồng thành công!")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 6. Kiểm tra sức chứa chuồng
    @GetMapping("/check-capacity/{code}")
    public ResponseEntity<ResponseModel<Map<String, Object>>> checkCapacity(
            @PathVariable String code) {
        try {
            Map<String, Object> result = barnService.checkCapacity(code);

            return ResponseEntity.ok(
                    ResponseModel.success(result, "Kiểm tra sức chứa chuồng thành công!")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // 7. Xác nhận kiểm tra chuồng
    @PostMapping("/check-capacity/{code}/confirm")
    public ResponseEntity<ResponseModel<BarnCapacityCheck>> confirmCapacityCheck(
            @PathVariable String code) {
        try {
            BarnCapacityCheck result = barnService.confirmCapacityCheck(code);

            return ResponseEntity.ok(
                    ResponseModel.success(result, "Xác nhận kiểm tra chuồng thành công!")
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // 8. Xem lịch sử kiểm tra chuồng
    @GetMapping("/check-capacity/{code}/history")
    public ResponseEntity<ResponseModel<List<BarnCapacityCheck>>> getCapacityCheckHistory(
            @PathVariable String code) {
        List<BarnCapacityCheck> history =
                barnService.getCapacityCheckHistory(code);

        return ResponseEntity.ok(
                ResponseModel.success(history, "Lấy lịch sử kiểm tra chuồng thành công!")
        );
    }

    // 9. Điều chuyển bò giữa các chuồng
    @PreAuthorize("hasRole('FARM_MANAGER')")
    @PostMapping("/cattle/{cattleId}/transfer")
    public ResponseEntity<ResponseModel<CattleTransfer>> transferCattle(
            @PathVariable String cattleId,
            @RequestBody CattleTransferRequest request) {
        try {
            CattleTransfer result =
                    barnService.transferCattle(cattleId, request);

            return ResponseEntity.ok(
                    ResponseModel.success(result, "Điều chuyển bò thành công!")
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage())
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }

    // 10. Xem lịch sử điều chuyển bò
    @GetMapping("/cattle/{cattleId}/transfer-history")
    public ResponseEntity<ResponseModel<List<CattleTransfer>>> getCattleTransferHistory(
            @PathVariable String cattleId) {
        List<CattleTransfer> history =
                barnService.getCattleTransferHistory(cattleId);

        return ResponseEntity.ok(
                ResponseModel.success(history, "Lấy lịch sử điều chuyển bò thành công!")
        );
    }

    // 11. Ghi nhận vệ sinh chuồng
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    @PostMapping("/{barnCode}/cleaning-logs")
    public ResponseEntity<ResponseModel<BarnCleaningLog>> createCleaningLog(
                @PathVariable String barnCode,
                @RequestBody BarnCleaningRequest request) {
        try {
                BarnCleaningLog result =
                        barnService.createCleaningLog(barnCode, request);

                return ResponseEntity.status(HttpStatus.CREATED).body(
                        ResponseModel.success(result, "Ghi nhận vệ sinh chuồng thành công!")
                );
        } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(
                        ResponseModel.error(e.getMessage())
                );
        } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        ResponseModel.error(e.getMessage())
                );
        }
    }

    // 12. Xem lịch sử vệ sinh chuồng
   @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
   @GetMapping("/{barnCode}/cleaning-logs")
   public ResponseEntity<ResponseModel<List<BarnCleaningLog>>> getCleaningHistory(
                @PathVariable String barnCode) {
        List<BarnCleaningLog> history =
                barnService.getCleaningHistory(barnCode);

        return ResponseEntity.ok(
                ResponseModel.success(history, "Lấy lịch sử vệ sinh chuồng thành công!")
        );
   }
}