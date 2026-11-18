
package com.bovsmart.jwt.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class KnowledgeIngestionService {

    private final QdrantService qdrantService;

    public KnowledgeIngestionService(QdrantService qdrantService) {
        this.qdrantService = qdrantService;
    }

    public int ingestAll() throws Exception {

        PathMatchingResourcePatternResolver resolver =
                new PathMatchingResourcePatternResolver();

        Resource[] files = resolver.getResources(
                "classpath:knowledge/*.md"
        );

        int savedChunks = 0;

        for (Resource file : files) {

            String content = StreamUtils.copyToString(
                    file.getInputStream(),
                    StandardCharsets.UTF_8
            );

            if (content.isBlank()) {
                continue;
            }

            String documentId = UUID.nameUUIDFromBytes(
                    file.getFilename().getBytes(StandardCharsets.UTF_8)
            ).toString();

            String[] paragraphs = content.split("\\n\\s*\\n");

            int chunkIndex = 0;

            for (String paragraph : paragraphs) {

                String chunk = paragraph.trim();

                if (chunk.length() < 30) {
                    continue;
                }

                qdrantService.saveKnowledge(
                        documentId,
                        chunkIndex,
                        chunk,
                        file.getFilename(),
                        ""
                );

                chunkIndex++;
                savedChunks++;
            }
        }

        return savedChunks;
    }
}
