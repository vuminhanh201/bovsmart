
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.HealthRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface HealthRecordRepository extends MongoRepository<HealthRecord, String> {

    List<HealthRecord> findByCattleIdOrderByCreatedAtDesc(String cattleId);

    List<HealthRecord> findByCattleIdInOrderByCreatedAtDesc(
            Collection<String> cattleIds
    );

    List<HealthRecord> findByRfidTag(String rfidTag);

    List<HealthRecord> findByEarTagNumber(String earTagNumber);

    List<HealthRecord> findByAssignedVetIdOrderByCreatedAtDesc(
            String assignedVetId
    );

    List<HealthRecord> findByAssignedVetIdAndRecordStatusOrderByCreatedAtDesc(
            String assignedVetId,
            String recordStatus
    );
}
