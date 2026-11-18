package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.FeedCategory;

import java.util.List;

public interface FeedCategoryService {

    FeedCategory createCategory(FeedCategory category);

    List<FeedCategory> getAllCategories();

    FeedCategory getCategoryById(String id);

    FeedCategory updateCategory(String id, FeedCategory category);

    void deleteCategory(String id);
}