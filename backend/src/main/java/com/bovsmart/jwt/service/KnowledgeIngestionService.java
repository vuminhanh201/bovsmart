
package com.bovsmart.jwt.service;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.ArrayList;

@Service
public class KnowledgeIngestionService {

    private final QdrantService qdrantService;

    public KnowledgeIngestionService(QdrantService qdrantService) {
        this.qdrantService = qdrantService;
    }

    private List<String> resolveAccessRoles(String filename) {
        String name = filename.toLowerCase(Locale.ROOT);

        if (name.startsWith("admin_")) {
            return List.of("ADMIN");
        }

        if (name.startsWith("manager_")) {
            return List.of("FARM_MANAGER");
        }

        if (name.startsWith("staff_")) {
            return List.of("STAFF");
        }

        // Tài liệu không có tiền tố được xem là kiến thức dùng chung.
        return List.of("ADMIN", "FARM_MANAGER", "STAFF");
    }

    public int ingestAll() throws Exception {

        PathMatchingResourcePatternResolver resolver =
                new PathMatchingResourcePatternResolver();

        Resource[] files = resolver.getResources(
                "classpath:knowledge/*.md"
        );

        int savedChunks = 0;

        for (Resource file : files) {

            String filename = file.getFilename();

            if (filename == null || filename.isBlank()) {
                continue;
            }

            String content = StreamUtils.copyToString(
                    file.getInputStream(),
                    StandardCharsets.UTF_8
            );

            if (content.isBlank()) {
                continue;
            }

            String documentId = UUID.nameUUIDFromBytes(
                    filename.getBytes(StandardCharsets.UTF_8)
            ).toString();

            List<String> accessRoles = resolveAccessRoles(filename);

            String[] paragraphs = content.split("\\n\\s*\\n");

            List<String> chunks = new java.util.ArrayList<>();

            for (String paragraph : paragraphs) {

                String chunk = paragraph.trim();

                if (chunk.length() < 30) {
                    continue;
                }

                chunks.add(chunk);
            }

            // Tạo embedding và thay thế dữ liệu cũ theo từng tài liệu.
            qdrantService.replaceKnowledgeDocument(
                    documentId,
                    chunks,
                    filename,
                    "",
                    accessRoles
            );

            savedChunks += chunks.size();
        }

        return savedChunks;
    }
}
