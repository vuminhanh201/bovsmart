package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.BarnCleaningLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BarnCleaningLogRepository
        extends MongoRepository<BarnCleaningLog, String> {

    List<BarnCleaningLog> findByBarnCodeOrderByCreatedAtDesc(String barnCode);
}