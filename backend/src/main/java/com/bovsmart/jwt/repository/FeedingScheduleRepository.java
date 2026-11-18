
package com.bovsmart.jwt.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.FeedingSchedule;

public interface FeedingScheduleRepository
        extends MongoRepository<FeedingSchedule, String> {

    List<FeedingSchedule> findByAssignedTo(String assignedTo);

    List<FeedingSchedule> findByBarnId(String barnId);

    List<FeedingSchedule> findByFeedingDate(LocalDate feedingDate);

    List<FeedingSchedule> findByStatus(String status);

    List<FeedingSchedule> findByCreatedBy(String createdBy);
}
