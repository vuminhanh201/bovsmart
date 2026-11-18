
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.HusbandryJournal;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface HusbandryJournalRepository
        extends MongoRepository<HusbandryJournal, String> {

    // Tra cứu nhật ký theo bò
    List<HusbandryJournal> findByCattleIdOrderByPerformedAtDesc(String cattleId);

    // Tra cứu nhật ký theo chuồng
    List<HusbandryJournal> findByBarnIdOrderByPerformedAtDesc(String barnId);

    // Tra cứu nhật ký theo người thực hiện
    List<HusbandryJournal> findByPerformedByOrderByPerformedAtDesc(String performedBy);
}
