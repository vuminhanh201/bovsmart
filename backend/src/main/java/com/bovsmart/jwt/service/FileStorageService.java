
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.response.FileUploadResponse;
import com.bovsmart.jwt.dto.response.FileUrlResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileStorageService {

    FileUploadResponse uploadImage(
            MultipartFile file,
            String uploadedBy,
            String role
    );

    FileUrlResponse getImageUrl(String id);

    List<FileUploadResponse> getMyImages(String uploadedBy);
}
