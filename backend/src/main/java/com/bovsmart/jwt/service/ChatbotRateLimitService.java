
package com.bovsmart.jwt.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatbotRateLimitService {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final int MAX_REQUESTS_PER_DAY = 100;

    private static final long MIN_INTERVAL_SECONDS = 2;

    private static final ZoneId ZONE_ID = ZoneId.of("Asia/Ho_Chi_Minh");

    private final ConcurrentHashMap<String, UserLimit> userLimits =
            new ConcurrentHashMap<>();

    public void checkLimit(String username) {

        if (username == null || username.isBlank()) {
            throw new ChatbotRateLimitException(
                    "Không xác định được tài khoản người dùng."
            );
        }

        UserLimit limit = userLimits.computeIfAbsent(
                username,
                key -> new UserLimit()
        );

        synchronized (limit) {

            Instant now = Instant.now();
            LocalDate today = now.atZone(ZONE_ID).toLocalDate();

            // Reset số lượng câu hỏi khi sang ngày mới
            if (!today.equals(limit.date)) {
                limit.date = today;
                limit.dailyCount = 0;
                limit.minuteRequests.clear();
            }

            // Xóa các yêu cầu đã quá 1 phút
            Instant oneMinuteAgo = now.minus(Duration.ofMinutes(1));

            while (!limit.minuteRequests.isEmpty()
                    && !limit.minuteRequests.peekFirst().isAfter(oneMinuteAgo)) {
                limit.minuteRequests.pollFirst();
            }

            // Kiểm tra khoảng cách giữa hai câu hỏi
            if (limit.lastRequest != null) {

                long elapsedSeconds = Duration.between(
                        limit.lastRequest,
                        now
                ).getSeconds();

                if (Duration.between(limit.lastRequest, now)
                        .compareTo(Duration.ofSeconds(MIN_INTERVAL_SECONDS)) < 0) {

                    throw new ChatbotRateLimitException(
                            "Bạn gửi câu hỏi quá nhanh. Vui lòng chờ ít nhất 2 giây."
                    );
                }
            }

            // Kiểm tra giới hạn mỗi phút
            if (limit.minuteRequests.size() >= MAX_REQUESTS_PER_MINUTE) {

                throw new ChatbotRateLimitException(
                        "Bạn đã đạt giới hạn 10 câu hỏi mỗi phút. Vui lòng thử lại sau."
                );
            }

            // Kiểm tra giới hạn mỗi ngày
            if (limit.dailyCount >= MAX_REQUESTS_PER_DAY) {

                throw new ChatbotRateLimitException(
                        "Bạn đã đạt giới hạn 100 câu hỏi mỗi ngày. Vui lòng quay lại ngày mai."
                );
            }

            // Ghi nhận yêu cầu hợp lệ
            limit.lastRequest = now;
            limit.minuteRequests.addLast(now);
            limit.dailyCount++;
        }
    }

    private static class UserLimit {

        private LocalDate date = LocalDate.now(ZONE_ID);

        private int dailyCount = 0;

        private Instant lastRequest;

        private final Deque<Instant> minuteRequests = new ArrayDeque<>();
    }
}
