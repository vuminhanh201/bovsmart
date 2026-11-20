
package com.bovsmart.jwt.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "chat_messages")
@CompoundIndex(
    name = "idx_chat_message_conversation_user_created",
    def = "{'conversationId': 1, 'userId': 1, 'createdAt': 1}"
)
public class ChatMessage {

    @Id
    private String id;

    private String conversationId;

    private String userId;

    // USER hoặc ASSISTANT
    private String role;

    private String content;

    private List<String> sources = new ArrayList<>();

    // Danh sách ID tệp đính kèm
    private List<String> attachmentIds = new ArrayList<>();

    private Instant createdAt = Instant.now();

    public ChatMessage() {
    }

    // Giữ constructor cũ để không ảnh hưởng code hiện tại
    public ChatMessage(
            String conversationId,
            String userId,
            String role,
            String content,
            List<String> sources
    ) {
        this.conversationId = conversationId;
        this.userId = userId;
        this.role = role;
        this.content = content;
        this.sources = sources != null ? sources : new ArrayList<>();
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getSources() {
        return sources;
    }

    public void setSources(List<String> sources) {
        this.sources = sources != null ? sources : new ArrayList<>();
    }

    public List<String> getAttachmentIds() {
        return attachmentIds;
    }

    public void setAttachmentIds(List<String> attachmentIds) {
        this.attachmentIds = attachmentIds != null
                ? attachmentIds
                : new ArrayList<>();
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
