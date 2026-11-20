
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.response.FileUploadResponse;
import com.bovsmart.jwt.dto.response.FileUrlResponse;
import com.bovsmart.jwt.model.StoredFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileStorageService {

    // Chức năng ảnh bò hiện tại
    FileUploadResponse uploadImage(
            MultipartFile file,
            String uploadedBy,
            String role
    );

    FileUrlResponse getImageUrl(String id);

    List<FileUploadResponse> getMyImages(String uploadedBy);

    // Chức năng upload tệp đính kèm chatbot
    FileUploadResponse uploadChatAttachment(
            MultipartFile file,
            String uploadedBy,
            String role
    );

    // Chỉ lấy tệp thuộc về đúng người dùng
    StoredFile getOwnedChatAttachment(
            String id,
            String uploadedBy
    );

    // Đọc nội dung tệp từ MinIO
    byte[] readChatAttachment(StoredFile storedFile);
}
