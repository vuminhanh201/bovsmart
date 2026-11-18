
package com.bovsmart.jwt.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatbotRequest(

        @NotBlank(message = "Câu hỏi không được để trống")
        @Size(max = 2000, message = "Câu hỏi không được vượt quá 2000 ký tự")
        String question

) {
}
