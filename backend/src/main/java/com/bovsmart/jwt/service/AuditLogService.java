package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.AuditLog;

import java.util.List;
import java.util.Map;

public interface AuditLogService {

    AuditLog createLog(
            String username,
            String role,
            String action,
            String targetType,
            String targetId,
            String description,
            Map<String, Object> details
    );

    List<AuditLog> getAllLogs();

    List<AuditLog> getLogsByUsername(String username);

    List<AuditLog> getLogsByAction(String action);

    List<AuditLog> getLogsByTarget(String targetType, String targetId);
}