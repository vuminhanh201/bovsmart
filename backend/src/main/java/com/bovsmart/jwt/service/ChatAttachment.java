
package com.bovsmart.jwt.service;

public record ChatAttachment(
        String originalName,
        String contentType,
        byte[] bytes
) {
    public ChatAttachment {
        if (originalName == null || originalName.isBlank()) {
            throw new IllegalArgumentException("Tên tệp không hợp lệ!");
        }

        if (contentType == null || contentType.isBlank()) {
            throw new IllegalArgumentException("Loại tệp không hợp lệ!");
        }

        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Tệp không có dữ liệu!");
        }
    }
}
