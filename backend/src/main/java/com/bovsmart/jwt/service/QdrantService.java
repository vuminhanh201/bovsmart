
package com.bovsmart.jwt.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class QdrantService {

    private final RestClient qdrantRestClient;
    private final EmbeddingService embeddingService;
    private final String collection;

    private static final Set<String> VALID_ROLES = Set.of(
            "ADMIN",
            "FARM_MANAGER",
            "STAFF"
    );

    public QdrantService(
            RestClient qdrantRestClient,
            EmbeddingService embeddingService,
            @Value("${qdrant.collection}") String collection
    ) {
        this.qdrantRestClient = qdrantRestClient;
        this.embeddingService = embeddingService;
        this.collection = collection;
    }

    /**
     * Lưu một chunk kiến thức.
     */
    public void saveKnowledge(
            String documentId,
            int chunkIndex,
            String content,
            String sourceTitle,
            String sourceUrl,
            List<String> accessRoles
    ) {
        validateDocument(documentId, accessRoles);

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "Nội dung tài liệu không được để trống"
            );
        }

        if (chunkIndex < 0) {
            throw new IllegalArgumentException(
                    "chunkIndex không hợp lệ"
            );
        }

        List<Double> vector = embeddingService.embed(content);

        Map<String, Object> point = buildPoint(
                documentId,
                chunkIndex,
                content,
                sourceTitle,
                sourceUrl,
                accessRoles,
                vector
        );

        Map<String, Object> requestBody = Map.of(
                "points", List.of(point)
        );

        qdrantRestClient.put()
                .uri("/collections/{collection}/points?wait=true", collection)
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();
    }

    /**
     * Thay thế toàn bộ chunk của một tài liệu.
     *
     * Tạo embedding cho tất cả chunk trước.
     * Chỉ dọn chunk cũ sau khi Qdrant nhận được lô dữ liệu mới.
     */
    public void replaceKnowledgeDocument(
                String documentId,
                List<String> chunks,
                String sourceTitle,
                String sourceUrl,
                List<String> accessRoles
        ) {
        validateDocument(documentId, accessRoles);

        if (chunks == null) {
                throw new IllegalArgumentException(
                        "Danh sách chunk không hợp lệ"
                );
        }

        List<Map<String, Object>> points = new ArrayList<>();

        // Bước 1: Tạo embedding cho toàn bộ chunk.
        for (int i = 0; i < chunks.size(); i++) {
                String chunk = chunks.get(i);

                if (chunk == null || chunk.isBlank()) {
                throw new IllegalArgumentException(
                        "Chunk tại vị trí " + i + " không hợp lệ"
                );
                }

                List<Double> vector = embeddingService.embed(chunk);

                points.add(buildPoint(
                        documentId,
                        i,
                        chunk,
                        sourceTitle,
                        sourceUrl,
                        accessRoles,
                        vector
                ));
        }

        // Bước 2: Lưu lô chunk mới vào Qdrant.
        if (!points.isEmpty()) {
                System.out.println(
                        "KIỂM TRA CHUNK TRƯỚC KHI GỬI QDRANT: "
                                + points.get(0).get("payload")
                );

                Map<String, Object> requestBody = Map.of(
                        "points", points
                );

                qdrantRestClient.put()
                        .uri(
                                "/collections/{collection}/points?wait=true",
                                collection
                        )
                        .body(requestBody)
                        .retrieve()
                        .toBodilessEntity();
        }

        // Bước 3: Chỉ dọn chunk cũ sau khi lưu lô mới thành công.
        deleteObsoleteChunks(documentId, chunks.size());
        }

    private Map<String, Object> buildPoint(
            String documentId,
            int chunkIndex,
            String content,
            String sourceTitle,
            String sourceUrl,
            List<String> accessRoles,
            List<Double> vector
    ) {
        String pointId = UUID.nameUUIDFromBytes(
                (documentId + "-" + chunkIndex)
                        .getBytes(StandardCharsets.UTF_8)
        ).toString();

        Map<String, Object> payload = new HashMap<>();

        payload.put("documentId", documentId);
        payload.put("chunkIndex", chunkIndex);
        payload.put("text", content);
        payload.put("accessRoles", accessRoles);

        if (sourceTitle != null && !sourceTitle.isBlank()) {
            payload.put("sourceTitle", sourceTitle);
        }

        if (sourceUrl != null && !sourceUrl.isBlank()) {
            payload.put("sourceUrl", sourceUrl);
        }

        return Map.of(
                "id", pointId,
                "vector", vector,
                "payload", payload
        );
    }

    private void validateDocument(
            String documentId,
            List<String> accessRoles
    ) {
        if (documentId == null || documentId.isBlank()) {
            throw new IllegalArgumentException(
                    "documentId không hợp lệ"
            );
        }

        if (accessRoles == null
                || accessRoles.isEmpty()
                || !VALID_ROLES.containsAll(accessRoles)) {
            throw new IllegalArgumentException(
                    "Danh sách quyền truy cập tài liệu không hợp lệ"
            );
        }
    }

    /**
     * Xóa các chunk có chỉ số không còn nằm trong tài liệu mới.
     */
    private void deleteObsoleteChunks(
                String documentId,
                int newChunkCount
        ) {
        Map<String, Object> documentCondition = Map.of(
                "key", "documentId",
                "match", Map.of("value", documentId)
        );

        List<Map<String, Object>> conditions = new ArrayList<>();
        conditions.add(documentCondition);

        // Nếu tài liệu mới vẫn có chunk, chỉ xóa chunk cũ
        // có chỉ số từ newChunkCount trở đi.
        if (newChunkCount > 0) {
                conditions.add(
                        Map.of(
                                "key", "chunkIndex",
                                "range", Map.of("gte", newChunkCount)
                        )
                );
        }

        Map<String, Object> requestBody = Map.of(
                "filter", Map.of("must", conditions)
        );

        qdrantRestClient.post()
                .uri(
                        "/collections/{collection}/points/delete?wait=true",
                        collection
                )
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();
        }

    public void deleteKnowledgeByDocumentId(String documentId) {
        if (documentId == null || documentId.isBlank()) {
            throw new IllegalArgumentException(
                    "documentId không hợp lệ"
            );
        }

        Map<String, Object> filter = Map.of(
                "must",
                List.of(
                        Map.of(
                                "key", "documentId",
                                "match", Map.of("value", documentId)
                        )
                )
        );

        Map<String, Object> requestBody = Map.of(
                "filter", filter
        );

        qdrantRestClient.post()
                .uri(
                        "/collections/{collection}/points/delete?wait=true",
                        collection
                )
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();
    }

    
        public List<Map<String, Object>> searchKnowledge(
                String question,
                int limit
        ) {
        if (question == null || question.isBlank()) {
                throw new IllegalArgumentException(
                        "Câu hỏi tìm kiếm không được để trống"
                );
        }

        if (limit <= 0) {
                throw new IllegalArgumentException(
                        "Giới hạn kết quả phải lớn hơn 0"
                );
        }

        List<Double> vector = embeddingService.embed(question);

        // Tìm kiếm toàn bộ kho kiến thức chung, không lọc theo vai trò.
        Map<String, Object> requestBody = Map.of(
                "query", vector,
                "limit", limit,
                "with_payload", true
        );

        Map<?, ?> response = qdrantRestClient.post()
                .uri(
                        "/collections/{collection}/points/query",
                        collection
                )
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null
                || !(response.get("result") instanceof Map<?, ?> result)) {
                return List.of();
        }

        Object pointsObject = result.get("points");

        if (!(pointsObject instanceof List<?> points)) {
                return List.of();
        }

        return points.stream()
                .filter(Map.class::isInstance)
                .map(item -> (Map<String, Object>) item)
                .toList();
        }

}
