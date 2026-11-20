
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.ChatbotRequest;
import com.bovsmart.jwt.dto.response.ChatbotResponse;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.StoredFile;
import com.bovsmart.jwt.service.ChatAttachment;
import com.bovsmart.jwt.service.ChatConversationService;
import com.bovsmart.jwt.service.ChatbotRateLimitService;
import com.bovsmart.jwt.service.ChatbotRateLimitException;
import com.bovsmart.jwt.service.FileStorageService;
import com.bovsmart.jwt.service.GeminiService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final GeminiService geminiService;
    private final ChatConversationService conversationService;
    private final ChatbotRateLimitService rateLimitService;
    private final FileStorageService fileStorageService;

    public ChatbotController(
            GeminiService geminiService,
            ChatConversationService conversationService,
            ChatbotRateLimitService rateLimitService,
            FileStorageService fileStorageService
    ) {
        this.geminiService = geminiService;
        this.conversationService = conversationService;
        this.rateLimitService = rateLimitService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/ask")
    public ResponseEntity<ResponseModel<ChatbotResponse>> ask(
            @Valid @RequestBody ChatbotRequest request,
            Authentication authentication
    ) {
        try {
            rateLimitService.checkLimit(authentication.getName());

            List<String> attachmentIds = request.attachmentIds() == null
                    ? List.of()
                    : request.attachmentIds();

            if (attachmentIds.size() > 5) {
                return ResponseEntity.badRequest().body(
                        ResponseModel.error(
                                "Mỗi câu hỏi chỉ được đính kèm tối đa 5 tệp!"
                        )
                );
            }

            List<ChatAttachment> attachments = new ArrayList<>();

            // Chỉ lấy tệp thuộc tài khoản đang đăng nhập.
            for (String attachmentId : attachmentIds) {
                StoredFile storedFile =
                        fileStorageService.getOwnedChatAttachment(
                                attachmentId,
                                authentication.getName()
                        );

                byte[] fileBytes =
                        fileStorageService.readChatAttachment(storedFile);

                attachments.add(
                        new ChatAttachment(
                                storedFile.getOriginalName(),
                                storedFile.getContentType(),
                                fileBytes
                        )
                );
            }

            // Lưu câu hỏi và danh sách ID tệp vào lịch sử.
            conversationService.saveMessage(
                    request.conversationId(),
                    "USER",
                    request.question(),
                    List.of(),
                    attachmentIds,
                    authentication
            );

            // Gửi câu hỏi và tệp đính kèm sang Gemini.
            ChatbotResponse response = geminiService.ask(
                    request.question(),
                    attachments,
                    authentication
            );

            conversationService.saveMessage(
                    request.conversationId(),
                    "ASSISTANT",
                    response.answer(),
                    response.sources(),
                    authentication
            );

            return ResponseEntity.ok(
                    ResponseModel.success(
                            response,
                            "Chatbot trả lời thành công!"
                    )
            );

        } catch (ChatbotRateLimitException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }
}
