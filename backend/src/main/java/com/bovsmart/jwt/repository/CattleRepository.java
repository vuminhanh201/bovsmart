
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.Cattle;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CattleRepository extends MongoRepository<Cattle, String> {

    boolean existsByRfidTag(String rfidTag);

    boolean existsByEarTagNumber(String earTagNumber);

    Optional<Cattle> findByRfidTag(String rfidTag);

    Optional<Cattle> findByEarTagNumber(String earTagNumber);

    long countByPenIdAndStatus(String penId, String status);

    long countByPenIdAndStatusNotIn(String penId, List<String> statuses);

    long countByStatusNotIn(List<String> statuses);

    long countByStatusIn(List<String> statuses);
    
    List<Cattle> findByPenId(String penId);
}
