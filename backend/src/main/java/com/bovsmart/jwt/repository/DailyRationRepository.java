package com.bovsmart.jwt.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.DailyRation;

public interface DailyRationRepository
        extends MongoRepository<DailyRation, String> {

    List<DailyRation> findByBarnId(String barnId);

    List<DailyRation> findByFeedingDate(LocalDate feedingDate);

    List<DailyRation> findByBarnIdAndFeedingDate(
            String barnId, LocalDate feedingDate);

    boolean existsByBarnIdAndFeedingDate(
            String barnId, LocalDate feedingDate);

    void deleteByIdIn(List<String> ids);
}