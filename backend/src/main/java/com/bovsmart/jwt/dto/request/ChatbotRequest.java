
package com.bovsmart.jwt.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChatbotRequest(

        @NotBlank(message = "Câu hỏi không được để trống")
        @Size(max = 2000, message = "Câu hỏi không được vượt quá 2000 ký tự")
        String question,

        @NotBlank(message = "Mã cuộc trò chuyện không được để trống")
        String conversationId,

        @Size(max = 5, message = "Mỗi câu hỏi chỉ được đính kèm tối đa 5 tệp")
        List<@NotBlank String> attachmentIds

) {
}
