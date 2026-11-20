
package com.bovsmart.jwt.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.ChatConversation;
import com.bovsmart.jwt.model.ChatMessage;
import com.bovsmart.jwt.service.ChatConversationService;

@RestController
@RequestMapping("/api/chatbot/conversations")
public class ChatConversationController {

    private final ChatConversationService conversationService;

    public ChatConversationController(
            ChatConversationService conversationService) {
        this.conversationService = conversationService;
    }

    // Tạo cuộc trò chuyện mới
    @PostMapping
    public ResponseEntity<ResponseModel<ChatConversation>> createConversation(
            Authentication authentication) {

        ChatConversation conversation =
                conversationService.createConversation(authentication);

        return ResponseEntity.ok(
                ResponseModel.success(
                        conversation,
                        "Tạo cuộc trò chuyện thành công!"
                )
        );
    }

    // Lấy danh sách cuộc trò chuyện
    @GetMapping
    public ResponseEntity<ResponseModel<List<ChatConversation>>> getConversations(
            Authentication authentication) {

        List<ChatConversation> conversations =
                conversationService.getConversations(authentication);

        return ResponseEntity.ok(
                ResponseModel.success(
                        conversations,
                        "Lấy danh sách cuộc trò chuyện thành công!"
                )
        );
    }

    // Lấy lịch sử tin nhắn
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<ResponseModel<List<ChatMessage>>> getMessages(
            @PathVariable String conversationId,
            Authentication authentication) {

        List<ChatMessage> messages =
                conversationService.getMessages(
                        conversationId,
                        authentication
                );

        return ResponseEntity.ok(
                ResponseModel.success(
                        messages,
                        "Lấy lịch sử trò chuyện thành công!"
                )
        );
    }

    // Xóa cuộc trò chuyện
    @DeleteMapping("/{conversationId}")
    public ResponseEntity<ResponseModel<String>> deleteConversation(
            @PathVariable String conversationId,
            Authentication authentication) {

        conversationService.deleteConversation(
                conversationId,
                authentication
        );

        return ResponseEntity.ok(
                ResponseModel.success(
                        "Đã xóa",
                        "Xóa cuộc trò chuyện thành công!"
                )
        );
    }
}
