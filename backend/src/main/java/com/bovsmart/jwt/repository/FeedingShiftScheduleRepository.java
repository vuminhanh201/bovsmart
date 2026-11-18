package com.bovsmart.jwt.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.FeedingShiftSchedule;

public interface FeedingShiftScheduleRepository
        extends MongoRepository<FeedingShiftSchedule, String> {

    List<FeedingShiftSchedule> findByDailyRationId(String dailyRationId);

    List<FeedingShiftSchedule> findByAssignedTo(String assignedTo);

    List<FeedingShiftSchedule> findByBarnIdAndFeedingDate(
            String barnId, LocalDate feedingDate);

    boolean existsByDailyRationIdAndShiftCode(
            String dailyRationId, String shiftCode);

    void deleteByDailyRationId(String dailyRationId);

    void deleteByIdIn(List<String> ids);
}