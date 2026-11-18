
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.VaccinationRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface VaccinationRecordRepository
        extends MongoRepository<VaccinationRecord, String> {

    List<VaccinationRecord> findByCattleIdOrderByCreatedAtDesc(String cattleId);

    List<VaccinationRecord> findByRfidTag(String rfidTag);

    List<VaccinationRecord> findByEarTagNumber(String earTagNumber);

    List<VaccinationRecord> findByNextVaccinationDateIsNotNull();
}
