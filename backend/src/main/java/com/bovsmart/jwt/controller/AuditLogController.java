package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.AuditLog;
import com.bovsmart.jwt.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    // ADMIN xem toàn bộ nhật ký
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseModel<List<AuditLog>>> getAllLogs() {
        try {
            List<AuditLog> logs = auditLogService.getAllLogs();
            return ResponseEntity.ok(
                    ResponseModel.success(logs, "Lấy nhật ký thao tác thành công")
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ResponseModel.error("Không thể lấy nhật ký thao tác")
            );
        }
    }

    // Tìm nhật ký theo người thực hiện
    @GetMapping("/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseModel<List<AuditLog>>> getLogsByUsername(
            @PathVariable String username
    ) {
        List<AuditLog> logs = auditLogService.getLogsByUsername(username);
        return ResponseEntity.ok(
                ResponseModel.success(logs, "Lấy nhật ký theo người dùng thành công")
        );
    }

    // Tìm nhật ký theo hành động
    @GetMapping("/action/{action}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseModel<List<AuditLog>>> getLogsByAction(
            @PathVariable String action
    ) {
        List<AuditLog> logs = auditLogService.getLogsByAction(action);
        return ResponseEntity.ok(
                ResponseModel.success(logs, "Lấy nhật ký theo hành động thành công")
        );
    }

    // Tìm nhật ký theo đối tượng
    @GetMapping("/target/{targetType}/{targetId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseModel<List<AuditLog>>> getLogsByTarget(
            @PathVariable String targetType,
            @PathVariable String targetId
    ) {
        List<AuditLog> logs =
                auditLogService.getLogsByTarget(targetType, targetId);

        return ResponseEntity.ok(
                ResponseModel.success(logs, "Lấy nhật ký theo đối tượng thành công")
        );
    }
}