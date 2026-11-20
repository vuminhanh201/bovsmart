
package com.bovsmart.jwt.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.ChatMessage;

public interface ChatMessageRepository
        extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findByConversationIdAndUserIdOrderByCreatedAtAsc(
            String conversationId,
            String userId
    );

    void deleteByConversationIdAndUserId(
            String conversationId,
            String userId
    );
}
