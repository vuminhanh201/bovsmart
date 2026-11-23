
package com.bovsmart.jwt.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.FeedTransaction;

public interface FeedTransactionRepository
        extends MongoRepository<FeedTransaction, String> {

    List<FeedTransaction> findByFeedIdOrderByTransactionDateDesc(String feedId);

    List<FeedTransaction> findByTransactionTypeOrderByTransactionDateDesc(String transactionType);

    List<FeedTransaction> findByTransactionStatusOrderByTransactionDateDesc(String transactionStatus);

    List<FeedTransaction> findByCreatedByOrderByTransactionDateDesc(String createdBy);

    List<FeedTransaction> findByReviewedByOrderByTransactionDateDesc(String reviewedBy);

    List<FeedTransaction> findAllByOrderByTransactionDateDesc();
}
