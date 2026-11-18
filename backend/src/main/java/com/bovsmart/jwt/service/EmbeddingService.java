
package com.bovsmart.jwt.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    private final RestClient geminiRestClient;

    public EmbeddingService(
            RestClient geminiRestClient,
            @Qualifier("geminiModel") String geminiModel
    ) {
        this.geminiRestClient = geminiRestClient;
    }

    public List<Double> embed(String text) {

        Map<String, Object> requestBody = Map.of(
                "content", Map.of(
                        "parts", List.of(
                                Map.of("text", text)
                        )
                ),
                "outputDimensionality", 768
        );

        Map<?, ?> response = geminiRestClient.post()
                .uri("/models/gemini-embedding-2:embedContent")
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (response == null || !(response.get("embedding") instanceof Map<?, ?> embedding)) {
            throw new IllegalStateException(
                    "Gemini Embedding không trả về dữ liệu."
            );
        }

        Object valuesObject = embedding.get("values");

        if (!(valuesObject instanceof List<?> values)
                || values.size() != 768) {
            throw new IllegalStateException(
                    "Vector Embedding không có đúng 768 chiều."
            );
        }

        return values.stream()
                .map(value -> ((Number) value).doubleValue())
                .toList();
    }
}
