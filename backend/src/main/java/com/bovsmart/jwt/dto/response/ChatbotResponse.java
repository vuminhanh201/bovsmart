
package com.bovsmart.jwt.dto.response;

import java.util.List;

public record ChatbotResponse(
        String answer,
        List<String> sources
) {
}
