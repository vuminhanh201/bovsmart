package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.SaleRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SaleRequestRepository extends MongoRepository<SaleRequest, String> {

    Optional<SaleRequest> findByRequestCode(String requestCode);

    List<SaleRequest> findByCattleId(String cattleId);

    List<SaleRequest> findByRequestedBy(String requestedBy);

    List<SaleRequest> findByStatus(String status);

    boolean existsByCattleIdAndStatus(String cattleId, String status);
}