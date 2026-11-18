package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.Feed;
import com.bovsmart.jwt.service.FeedService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feeds")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @PostMapping
    public ResponseEntity<ResponseModel<Feed>> createFeed(
            @RequestBody Feed feed) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ResponseModel.success(
                        feedService.createFeed(feed),
                        "Thêm thức ăn vào kho thành công!"));
    }

    @GetMapping
    public ResponseEntity<ResponseModel<List<Feed>>> getAllFeeds() {
        return ResponseEntity.ok(
                ResponseModel.success(
                        feedService.getAllFeeds(),
                        "Lấy danh sách thức ăn thành công!"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseModel<Feed>> getFeedById(
            @PathVariable String id) {
        return ResponseEntity.ok(
                ResponseModel.success(
                        feedService.getFeedById(id),
                        "Lấy thông tin thức ăn thành công!"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResponseModel<Feed>> updateFeed(
            @PathVariable String id,
            @RequestBody Feed feed) {
        return ResponseEntity.ok(
                ResponseModel.success(
                        feedService.updateFeed(id, feed),
                        "Cập nhật thức ăn thành công!"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ResponseModel<String>> deleteFeed(
            @PathVariable String id) {
        feedService.deleteFeed(id);
        return ResponseEntity.ok(
                ResponseModel.success(
                        "Đã xóa",
                        "Xóa thức ăn thành công!"));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ResponseModel<List<Feed>>> getFeedsByCategory(
            @PathVariable String categoryId) {
        return ResponseEntity.ok(
                ResponseModel.success(
                        feedService.getFeedsByCategory(categoryId),
                        "Lấy thức ăn theo danh mục thành công!"));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ResponseModel<List<Feed>>> getFeedsByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(
                ResponseModel.success(
                        feedService.getFeedsByStatus(status),
                        "Lấy thức ăn theo trạng thái thành công!"));
    }

    
    @GetMapping("/low-stock")
    public ResponseEntity<ResponseModel<List<Feed>>> getLowStockFeeds() {
        return ResponseEntity.ok(
                ResponseModel.success(
                        feedService.getLowStockFeeds(),
                        "Lấy danh sách cảnh báo tồn kho thấp thành công!"
                )
        );
    }

}