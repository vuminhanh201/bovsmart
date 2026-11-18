package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.FeedCategory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface FeedCategoryRepository extends MongoRepository<FeedCategory, String> {

    Optional<FeedCategory> findByCategoryName(String categoryName);

    boolean existsByCategoryName(String categoryName);
}