package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.model.AuditLog;
import com.bovsmart.jwt.repository.AuditLogRepository;
import com.bovsmart.jwt.service.AuditLogService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public AuditLog createLog(
            String username,
            String role,
            String action,
            String targetType,
            String targetId,
            String description,
            Map<String, Object> details
    ) {
        AuditLog log = new AuditLog();

        log.setUsername(username);
        log.setRole(role);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDescription(description);
        log.setTimestamp(LocalDateTime.now());
        log.setDetails(details);

        return auditLogRepository.save(log);
    }

    @Override
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    @Override
    public List<AuditLog> getLogsByUsername(String username) {
        return auditLogRepository.findByUsernameOrderByTimestampDesc(username);
    }

    @Override
    public List<AuditLog> getLogsByAction(String action) {
        return auditLogRepository.findByActionOrderByTimestampDesc(action);
    }

    @Override
    public List<AuditLog> getLogsByTarget(String targetType, String targetId) {
        return auditLogRepository
                .findByTargetTypeAndTargetIdOrderByTimestampDesc(
                        targetType,
                        targetId
                );
    }
}