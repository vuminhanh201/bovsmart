package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.model.FeedCategory;
import com.bovsmart.jwt.repository.FeedCategoryRepository;
import com.bovsmart.jwt.service.FeedCategoryService;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FeedCategoryServiceImpl implements FeedCategoryService {

    private final FeedCategoryRepository categoryRepository;

    public FeedCategoryServiceImpl(FeedCategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public FeedCategory createCategory(FeedCategory category) {
        if (category.getCategoryName() == null || category.getCategoryName().trim().isEmpty()) {
            throw new RuntimeException("Tên danh mục thức ăn không được để trống!");
        }

        if (categoryRepository.existsByCategoryName(category.getCategoryName())) {
            throw new RuntimeException("Danh mục thức ăn đã tồn tại!");
        }

        if (category.getStatus() == null || category.getStatus().isEmpty()) {
            category.setStatus("ACTIVE");
        }

        return categoryRepository.save(category);
    }

    @Override
    public List<FeedCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Override
    public FeedCategory getCategoryById(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục thức ăn!"));
    }

    @Override
    public FeedCategory updateCategory(String id, FeedCategory category) {
        FeedCategory existing = getCategoryById(id);

        if (category.getCategoryName() == null || category.getCategoryName().trim().isEmpty()) {
            throw new RuntimeException("Tên danh mục thức ăn không được để trống!");
        }

        categoryRepository.findByCategoryName(category.getCategoryName())
                .ifPresent(found -> {
                    if (!found.getId().equals(id)) {
                        throw new RuntimeException("Tên danh mục thức ăn đã tồn tại!");
                    }
                });

        existing.setCategoryName(category.getCategoryName());
        existing.setDescription(category.getDescription());

        if (category.getStatus() != null && !category.getStatus().isEmpty()) {
            existing.setStatus(category.getStatus());
        }

        return categoryRepository.save(existing);
    }

    @Override
    public void deleteCategory(String id) {
        FeedCategory category = getCategoryById(id);
        categoryRepository.delete(category);
    }
}