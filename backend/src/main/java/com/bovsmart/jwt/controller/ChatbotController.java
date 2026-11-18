
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.ChatbotRequest;
import com.bovsmart.jwt.dto.response.ChatbotResponse;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.service.GeminiService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final GeminiService geminiService;

    public ChatbotController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/ask")
    public ResponseEntity<ResponseModel<ChatbotResponse>> ask(
            @Valid @RequestBody ChatbotRequest request
    ) {

        ChatbotResponse response =
                geminiService.ask(request.question());

        return ResponseEntity.ok(
                ResponseModel.success(
                        response,
                        "Chatbot trả lời thành công!"
                )
        );
    }
}
