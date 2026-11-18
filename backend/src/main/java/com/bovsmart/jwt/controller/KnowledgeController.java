
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.service.KnowledgeIngestionService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeIngestionService ingestionService;

    public KnowledgeController(
            KnowledgeIngestionService ingestionService
    ) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/ingest")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResponseModel<Map<String, Integer>>> ingest()
            throws Exception {

        int savedChunks = ingestionService.ingestAll();

        return ResponseEntity.ok(
                ResponseModel.success(
                        Map.of("savedChunks", savedChunks),
                        "Nạp kiến thức vào Qdrant thành công!"
                )
        );
    }
}
