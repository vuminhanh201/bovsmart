
package com.bovsmart.jwt.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.FeedingRecord;

public interface FeedingRecordRepository
        extends MongoRepository<FeedingRecord, String> {

    List<FeedingRecord> findByScheduleId(String scheduleId);

    List<FeedingRecord> findByPerformedBy(String performedBy);

    List<FeedingRecord> findByReviewedBy(String reviewedBy);

    List<FeedingRecord> findByRecordStatus(String recordStatus);

    List<FeedingRecord> findByFeedId(String feedId);

    List<FeedingRecord> findByBarnId(String barnId);
}
