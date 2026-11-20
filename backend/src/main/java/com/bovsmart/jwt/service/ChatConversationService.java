
package com.bovsmart.jwt.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.bovsmart.jwt.model.ChatConversation;
import com.bovsmart.jwt.model.ChatMessage;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.repository.ChatConversationRepository;
import com.bovsmart.jwt.repository.ChatMessageRepository;
import com.bovsmart.jwt.repository.UserRepository;

@Service
public class ChatConversationService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;

    public ChatConversationService(
            ChatConversationRepository conversationRepository,
            ChatMessageRepository messageRepository,
            UserRepository userRepository) {

        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Bạn cần đăng nhập!");
        }

        String login = authentication.getName();

        User user = userRepository.findByUsername(login)
                .or(() -> userRepository.findByEmail(login))
                .orElseThrow(() ->
                        new UsernameNotFoundException("Không tìm thấy tài khoản!"));

        if (!user.isEnabled()) {
            throw new AccessDeniedException("Tài khoản đã bị vô hiệu hóa!");
        }

        return user;
    }

    // Tạo cuộc trò chuyện mới
    public ChatConversation createConversation(Authentication authentication) {

        User user = getCurrentUser(authentication);

        ChatConversation conversation = new ChatConversation(
                user.getId(),
                "Cuộc trò chuyện mới"
        );

        return conversationRepository.save(conversation);
    }

    // Lấy danh sách cuộc trò chuyện
    public List<ChatConversation> getConversations(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return conversationRepository
                .findByUserIdOrderByUpdatedAtDesc(user.getId());
    }

    // Lấy tin nhắn trong một cuộc trò chuyện
    public List<ChatMessage> getMessages(
            String conversationId,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        verifyConversationOwner(conversationId, user.getId());

        return messageRepository
                .findByConversationIdAndUserIdOrderByCreatedAtAsc(
                        conversationId,
                        user.getId()
                );
    }

    // Giữ phương thức cũ để tương thích code hiện tại
    public ChatMessage saveMessage(
            String conversationId,
            String role,
            String content,
            List<String> sources,
            Authentication authentication) {

        return saveMessage(
                conversationId,
                role,
                content,
                sources,
                null,
                authentication
        );
    }

    // Lưu tin nhắn kèm tệp đính kèm
    public ChatMessage saveMessage(
            String conversationId,
            String role,
            String content,
            List<String> sources,
            List<String> attachmentIds,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        ChatConversation conversation =
                verifyConversationOwner(conversationId, user.getId());

        if (!"USER".equals(role) && !"ASSISTANT".equals(role)) {
            throw new IllegalArgumentException("Vai trò tin nhắn không hợp lệ!");
        }

        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException(
                    "Nội dung tin nhắn không được để trống!"
            );
        }

        ChatMessage message = new ChatMessage(
                conversationId,
                user.getId(),
                role,
                content.trim(),
                sources
        );

        // Chỉ lưu tệp đính kèm cho tin nhắn USER
        if ("USER".equals(role)) {
            message.setAttachmentIds(
                    attachmentIds != null
                            ? new ArrayList<>(attachmentIds)
                            : new ArrayList<>()
            );
        }

        ChatMessage savedMessage = messageRepository.save(message);

        // Tự động đặt tiêu đề theo câu hỏi đầu tiên
        if ("USER".equals(role)
                && "Cuộc trò chuyện mới".equals(conversation.getTitle())) {

            String title = content.trim();

            if (title.length() > 50) {
                title = title.substring(0, 50) + "...";
            }

            conversation.setTitle(title);
        }

        conversation.setUpdatedAt(Instant.now());
        conversationRepository.save(conversation);

        return savedMessage;
    }

    // Xóa cuộc trò chuyện và toàn bộ tin nhắn
    public void deleteConversation(
            String conversationId,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        verifyConversationOwner(conversationId, user.getId());

        messageRepository.deleteByConversationIdAndUserId(
                conversationId,
                user.getId()
        );

        conversationRepository.deleteByIdAndUserId(
                conversationId,
                user.getId()
        );
    }

    // Kiểm tra quyền sở hữu
    private ChatConversation verifyConversationOwner(
            String conversationId,
            String userId) {

        return conversationRepository
                .findByIdAndUserId(conversationId, userId)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "Bạn không có quyền truy cập cuộc trò chuyện này!"
                        ));
    }
}
