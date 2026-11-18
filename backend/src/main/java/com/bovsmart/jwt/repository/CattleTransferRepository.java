package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.CattleTransfer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CattleTransferRepository
        extends MongoRepository<CattleTransfer, String> {

    List<CattleTransfer> findByCattleIdOrderByTransferredAtDesc(String cattleId);

    List<CattleTransfer> findByFromBarnCodeOrToBarnCodeOrderByTransferredAtDesc(
            String fromBarnCode, String toBarnCode);
}