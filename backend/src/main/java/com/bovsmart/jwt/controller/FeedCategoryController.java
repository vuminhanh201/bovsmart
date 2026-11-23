package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.FeedCategory;
import com.bovsmart.jwt.service.FeedCategoryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feed-categories")
public class FeedCategoryController {

    private final FeedCategoryService categoryService;

    public FeedCategoryController(FeedCategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @PreAuthorize("hasRole('FARM_MANAGER')")
    @PostMapping
    public ResponseEntity<ResponseModel<FeedCategory>> createCategory(
            @RequestBody FeedCategory category) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        categoryService.createCategory(category),
                        "Thêm danh mục thức ăn thành công!"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    @GetMapping
    public ResponseEntity<ResponseModel<List<FeedCategory>>> getAllCategories() {
        return ResponseEntity.ok(
                ResponseModel.success(
                        categoryService.getAllCategories(),
                        "Lấy danh sách danh mục thức ăn thành công!"));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    @GetMapping("/{id}")
    public ResponseEntity<ResponseModel<FeedCategory>> getCategoryById(
            @PathVariable String id) {
        return ResponseEntity.ok(
                ResponseModel.success(
                        categoryService.getCategoryById(id),
                        "Lấy thông tin danh mục thức ăn thành công!"));
    }

    @PreAuthorize("hasRole('FARM_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ResponseModel<FeedCategory>> updateCategory(
            @PathVariable String id,
            @RequestBody FeedCategory category) {
        return ResponseEntity.ok(
                ResponseModel.success(
                        categoryService.updateCategory(id, category),
                        "Cập nhật danh mục thức ăn thành công!"));
    }

    @PreAuthorize("hasRole('FARM_MANAGER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseModel<String>> deleteCategory(
            @PathVariable String id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(
                ResponseModel.success(
                        "Đã xóa",
                        "Xóa danh mục thức ăn thành công!"));
    }
}