
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.response.FileUploadResponse;
import com.bovsmart.jwt.dto.response.FileUrlResponse;
import com.bovsmart.jwt.model.StoredFile;
import com.bovsmart.jwt.repository.StoredFileRepository;
import com.bovsmart.jwt.service.FileStorageService;
import com.bovsmart.jwt.service.AuditLogService;

import io.minio.BucketExistsArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import io.minio.RemoveObjectArgs;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;
import java.util.Map;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private final MinioClient minioClient;
    private final StoredFileRepository storedFileRepository;
    private final AuditLogService auditLogService;
    @Value("${minio.bucket-name}")
    private String bucketName;

    public FileStorageServiceImpl(
            MinioClient minioClient,
            StoredFileRepository storedFileRepository,
            AuditLogService auditLogService
    ) {
        this.minioClient = minioClient;
        this.storedFileRepository = storedFileRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    public FileUploadResponse uploadImage(
            MultipartFile file,
            String uploadedBy,
            String role
    ) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("Vui lòng chọn ảnh!");
            }

            if (file.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException(
                        "Dung lượng ảnh không được vượt quá 5MB!"
                );
            }

            byte[] imageBytes = file.getBytes();

            String contentType = detectImageType(imageBytes);

            if (contentType == null) {
                throw new IllegalArgumentException(
                        "File không phải ảnh hợp lệ! Chỉ chấp nhận JPG, PNG, GIF."
                );
            }

            BufferedImage image = ImageIO.read(
                    new ByteArrayInputStream(imageBytes)
            );

            if (image == null) {
                throw new IllegalArgumentException(
                        "Không thể đọc dữ liệu ảnh!"
                );
            }

            String extension;

            switch (contentType) {
                case "image/jpeg":
                    extension = ".jpg";
                    break;
                case "image/png":
                    extension = ".png";
                    break;
                case "image/gif":
                    extension = ".gif";
                    break;
                default:
                    throw new IllegalArgumentException(
                            "Định dạng ảnh không được hỗ trợ!"
                    );
            }

            boolean bucketExists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );

            if (!bucketExists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
            }

            String objectName = UUID.randomUUID() + extension;

            try (InputStream inputStream =
                         new ByteArrayInputStream(imageBytes)) {

                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .stream(inputStream, imageBytes.length, -1)
                                .contentType(contentType)
                                .build()
                );
            }

            StoredFile storedFile = new StoredFile();

            storedFile.setOriginalName(file.getOriginalFilename());
            storedFile.setBucketName(bucketName);
            storedFile.setObjectName(objectName);
            storedFile.setContentType(contentType);
            storedFile.setFileSize(file.getSize());
            storedFile.setUploadedBy(uploadedBy);
            storedFile.setCreatedAt(LocalDateTime.now());
            storedFile.setDeleted(false);

            StoredFile savedFile;

            try {
                savedFile = storedFileRepository.save(storedFile);
            } catch (Exception mongoException) {
                try {
                    minioClient.removeObject(
                            RemoveObjectArgs.builder()
                                    .bucket(bucketName)
                                    .object(objectName)
                                    .build()
                    );
                } catch (Exception cleanupException) {
                    mongoException.addSuppressed(cleanupException);
                }

                throw mongoException;
            }

    // Ghi nhật ký thao tác upload ảnh bò
    Map<String, Object> auditDetails = new HashMap<>();
    auditDetails.put("fileId", savedFile.getId());
    auditDetails.put("originalName", savedFile.getOriginalName());
    auditDetails.put("contentType", savedFile.getContentType());
    auditDetails.put("fileSize", savedFile.getFileSize());
    auditDetails.put("bucketName", savedFile.getBucketName());

    auditLogService.createLog(
            uploadedBy,
            role,
            "CATTLE_IMAGE_UPLOADED",
            "CATTLE_IMAGE",
            savedFile.getId(),
            "Tải ảnh bò lên hệ thống MinIO",
            auditDetails
    );

    return new FileUploadResponse(
            savedFile.getId(),
            savedFile.getOriginalName(),
            savedFile.getContentType(),
            savedFile.getFileSize(),
            "Upload ảnh thành công!"
    );

            } catch (Exception e) {
            e.printStackTrace();

            throw new RuntimeException(
                    "Không thể upload ảnh lên hệ thống!",
                    e
            );
        }
    }

    @Override
    public FileUrlResponse getImageUrl(String id) {
        try {
            StoredFile storedFile = storedFileRepository
                    .findByIdAndDeletedFalse(id)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Không tìm thấy ảnh!"
                            )
                    );

            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(storedFile.getBucketName())
                            .object(storedFile.getObjectName())
                            .expiry(15, TimeUnit.MINUTES)
                            .build()
            );

            return new FileUrlResponse(
                    storedFile.getId(),
                    url,
                    900
            );

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể tạo đường dẫn xem ảnh!",
                    e
            );
        }
    }

    @Override
    public List<FileUploadResponse> getMyImages(String uploadedBy) {

        return storedFileRepository
                .findByUploadedByAndDeletedFalseOrderByCreatedAtDesc(
                        uploadedBy
                )
                .stream()
                .map(file -> new FileUploadResponse(
                        file.getId(),
                        file.getOriginalName(),
                        file.getContentType(),
                        file.getFileSize(),
                        "Ảnh đã được lưu"
                ))
                .toList();
    }

    private String detectImageType(byte[] bytes) {

        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }

        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 0x50
                && bytes[2] == 0x4E
                && bytes[3] == 0x47
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A) {
            return "image/png";
        }

        if (bytes.length >= 6) {
            String header = new String(bytes, 0, 6);

            if (header.equals("GIF87a") || header.equals("GIF89a")) {
                return "image/gif";
            }
        }

        return null;
    }
}
