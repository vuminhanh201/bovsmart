
package com.bovsmart.jwt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class QdrantConfig {

    @Value("${qdrant.base-url}")
    private String baseUrl;

    @Bean
    public RestClient qdrantRestClient() {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
}
