package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByUsernameOrderByTimestampDesc(String username);

    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    List<AuditLog> findByTargetTypeAndTargetIdOrderByTimestampDesc(
            String targetType,
            String targetId
    );
}