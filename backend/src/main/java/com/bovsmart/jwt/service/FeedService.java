
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.Feed;

import java.util.List;

public interface FeedService {

    Feed createFeed(Feed feed);

    List<Feed> getAllFeeds();

    Feed getFeedById(String id);

    Feed updateFeed(String id, Feed feed);

    void deleteFeed(String id);

    List<Feed> getFeedsByCategory(String categoryId);

    List<Feed> getFeedsByStatus(String status);

    // Lấy danh sách thức ăn có tồn kho thấp
    List<Feed> getLowStockFeeds();
}
