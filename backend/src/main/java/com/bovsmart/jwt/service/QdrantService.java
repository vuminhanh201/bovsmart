
package com.bovsmart.jwt.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class QdrantService {

    private final RestClient qdrantRestClient;
    private final EmbeddingService embeddingService;
    private final String collection;

    public QdrantService(
            RestClient qdrantRestClient,
            EmbeddingService embeddingService,
            @Value("${qdrant.collection}") String collection
    ) {
        this.qdrantRestClient = qdrantRestClient;
        this.embeddingService = embeddingService;
        this.collection = collection;
    }

    public void saveKnowledge(
            String documentId,
            int chunkIndex,
            String content,
            String sourceTitle,
            String sourceUrl
    ) {
        List<Double> vector = embeddingService.embed(content);

        String pointId = UUID.nameUUIDFromBytes(
                (documentId + "-" + chunkIndex)
                        .getBytes(StandardCharsets.UTF_8)
        ).toString();

        Map<String, Object> point = Map.of(
                "id", pointId,
                "vector", vector,
                "payload", Map.of(
                        "documentId", documentId,
                        "chunkIndex", chunkIndex,
                        "text", content,
                        "sourceTitle", sourceTitle,
                        "sourceUrl", sourceUrl
                )
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


    public List<Map<String, Object>> searchKnowledge(
            String question,
            int limit
    ) {
        List<Double> vector = embeddingService.embed(question);

        Map<String, Object> requestBody = Map.of(
                "query", vector,
                "limit", limit,
                "with_payload", true
        );

        Map<?, ?> response = qdrantRestClient.post()
                .uri("/collections/{collection}/points/query", collection)
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
