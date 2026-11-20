
package com.bovsmart.jwt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.ChatConversation;

public interface ChatConversationRepository
        extends MongoRepository<ChatConversation, String> {

    List<ChatConversation> findByUserIdOrderByUpdatedAtDesc(String userId);

    Optional<ChatConversation> findByIdAndUserId(
            String id,
            String userId
    );

    void deleteByIdAndUserId(String id, String userId);
}
