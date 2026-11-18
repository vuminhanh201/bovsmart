package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.Barn;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface BarnRepository extends MongoRepository<Barn, String> {

    Optional<Barn> findByCode(String code);

    boolean existsByCode(String code);
}