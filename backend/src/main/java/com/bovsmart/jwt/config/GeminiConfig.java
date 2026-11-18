
package com.bovsmart.jwt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

@Configuration
public class GeminiConfig {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String model;

    @Bean
    public RestClient geminiRestClient() {
        return RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .defaultHeader("x-goog-api-key", apiKey)
                .defaultHeader(
                        HttpHeaders.CONTENT_TYPE,
                        MediaType.APPLICATION_JSON_VALUE
                )
                .build();
    }

    @Bean
    public String geminiModel() {
        return model;
    }
}
