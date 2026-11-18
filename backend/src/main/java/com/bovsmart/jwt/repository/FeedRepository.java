
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.Feed;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FeedRepository extends MongoRepository<Feed, String> {

    Optional<Feed> findByFeedCode(String feedCode);

    boolean existsByFeedCode(String feedCode);

    List<Feed> findByCategoryId(String categoryId);

    List<Feed> findByStatus(String status);

    @Query("{ '$expr': { '$lte': ['$quantity', '$minStock'] } }")
    List<Feed> findLowStockFeeds();
}
