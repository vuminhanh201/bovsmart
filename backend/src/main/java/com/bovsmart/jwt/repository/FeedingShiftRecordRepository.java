
package com.bovsmart.jwt.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.FeedingShiftRecord;

public interface FeedingShiftRecordRepository
        extends MongoRepository<FeedingShiftRecord, String> {

    List<FeedingShiftRecord> findByShiftScheduleId(String shiftScheduleId);

    List<FeedingShiftRecord> findByPerformedBy(String performedBy);

    List<FeedingShiftRecord> findByReviewedBy(String reviewedBy);

    List<FeedingShiftRecord> findByRecordStatus(String recordStatus);

    List<FeedingShiftRecord> findByBarnId(String barnId);
}
