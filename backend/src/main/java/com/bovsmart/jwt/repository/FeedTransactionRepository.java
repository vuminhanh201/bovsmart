package com.bovsmart.jwt.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.FeedTransaction;

public interface FeedTransactionRepository
        extends MongoRepository<FeedTransaction, String> {

    List<FeedTransaction> findByFeedId(String feedId);

    List<FeedTransaction> findByTransactionType(String transactionType);

    List<FeedTransaction> findByTransactionStatus(String transactionStatus);

    List<FeedTransaction> findByCreatedBy(String createdBy);

    List<FeedTransaction> findByReviewedBy(String reviewedBy);
}
