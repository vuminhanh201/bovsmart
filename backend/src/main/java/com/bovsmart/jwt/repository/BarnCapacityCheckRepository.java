package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.BarnCapacityCheck;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface BarnCapacityCheckRepository
        extends MongoRepository<BarnCapacityCheck, String> {

    List<BarnCapacityCheck> findByBarnCodeOrderByCheckedAtDesc(String barnCode);
}