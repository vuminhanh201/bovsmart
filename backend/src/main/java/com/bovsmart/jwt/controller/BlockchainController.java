
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.BlockchainBlock;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.BlockchainService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blockchain")
public class BlockchainController {

    private final BlockchainService blockchainService;

    public BlockchainController(BlockchainService blockchainService) {
        this.blockchainService = blockchainService;
    }

    /**
     * Lấy danh sách các khối Blockchain.
     */
    @GetMapping("/blocks")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<List<BlockchainBlock>>> getAllBlocks() {

        return ResponseEntity.ok(
                ResponseModel.success(
                        blockchainService.getAllBlocks(),
                        "Lấy danh sách khối Blockchain thành công!"
                )
        );
    }

    /**
     * Kiểm tra tính toàn vẹn của chuỗi Blockchain.
     */
    @GetMapping("/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<Boolean>> verifyChain() {

        boolean valid = blockchainService.verifyChain();

        return ResponseEntity.ok(
                ResponseModel.success(
                        valid,
                        valid
                                ? "Chuỗi Blockchain hợp lệ!"
                                : "Phát hiện chuỗi Blockchain không hợp lệ!"
                )
        );
    }

    /**
     * Tạo block sau khi thao tác nghiệp vụ được lưu thành công.
     * Người thực hiện và vai trò được lấy trực tiếp từ JWT.
     */
    @PostMapping("/blocks")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<BlockchainBlock>> createBlock(
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {

        Object actionValue = request.get("action");

        if (!(actionValue instanceof String) || ((String) actionValue).isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tên thao tác Blockchain không được để trống!"
            );
        }

        String action = ((String) actionValue).trim();

        Map<String, Object> data = new LinkedHashMap<>();

        Object dataValue = request.get("data");

        if (dataValue instanceof Map<?, ?> rawData) {
            rawData.forEach((key, value) -> {
                if (key instanceof String) {
                    data.put((String) key, value);
                }
            });
        }

        if (authentication == null
                || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Không xác định được tài khoản thực hiện!"
            );
        }

        UserDetailsImpl userDetails =
                (UserDetailsImpl) authentication.getPrincipal();

        String operator = userDetails.getEmail();

        String role = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .findFirst()
                .orElse("UNKNOWN");

        BlockchainBlock block = blockchainService.createBlock(
                action,
                data,
                operator,
                role
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        block,
                        "Tạo khối Blockchain thành công!"
                )
        );
    }
}
