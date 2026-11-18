package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.VerificationCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends MongoRepository<VerificationCode, String> {

    Optional<VerificationCode> findByEmailAndCodeAndTypeAndVerifiedFalse(String email, String code, String type);

    List<VerificationCode> findByEmail(String email);

    boolean existsByCodeAndExpiryDateAfterAndVerifiedFalse(String code, Instant now);

    void deleteByEmailAndType(String email, String type);

    void deleteByExpiryDateBefore(Instant now);
}

