
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.response.FileUploadResponse;
import com.bovsmart.jwt.dto.response.FileUrlResponse;
import com.bovsmart.jwt.model.StoredFile;
import com.bovsmart.jwt.repository.StoredFileRepository;
import com.bovsmart.jwt.service.FileStorageService;
import com.bovsmart.jwt.service.AuditLogService;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.http.Method;
import io.minio.RemoveObjectArgs;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.xwpf.usermodel.XWPFDocument;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Locale;
import java.util.Set;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;
    private static final long MAX_CHAT_FILE_SIZE = 10L * 1024 * 1024;

    private static final Set<String> CHAT_EXTENSIONS = Set.of(
            ".pdf", ".docx", ".xlsx", ".xls",
            ".csv", ".jpg", ".jpeg", ".png", ".gif"
    );

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

    // ==========================================
    // UPLOAD ẢNH BÒ - GIỮ CHỨC NĂNG CŨ
    // ==========================================

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

            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new IllegalArgumentException(
                        "Dung lượng ảnh không được vượt quá 5MB!"
                );
            }

            byte[] bytes = file.getBytes();
            String contentType = detectImageType(bytes);

            if (contentType == null) {
                throw new IllegalArgumentException(
                        "Chỉ chấp nhận ảnh JPG, PNG, GIF hợp lệ!"
                );
            }

            BufferedImage image = ImageIO.read(
                    new ByteArrayInputStream(bytes)
            );

            if (image == null) {
                throw new IllegalArgumentException(
                        "Không thể đọc dữ liệu ảnh!"
                );
            }

            String extension = getImageExtension(contentType);

            ensureBucketExists();

            String objectName = UUID.randomUUID() + extension;

            uploadToMinio(objectName, contentType, bytes);

            StoredFile savedFile = saveMetadata(
                    file.getOriginalFilename(),
                    objectName,
                    contentType,
                    bytes.length,
                    uploadedBy
            );

            writeAuditLog(
                    uploadedBy,
                    role,
                    "CATTLE_IMAGE_UPLOADED",
                    "CATTLE_IMAGE",
                    savedFile,
                    "Tải ảnh bò lên hệ thống MinIO"
            );

            return toUploadResponse(
                    savedFile,
                    "Upload ảnh thành công!"
            );

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể upload ảnh lên hệ thống!",
                    e
            );
        }
    }

    // ==========================================
    // UPLOAD TỆP CHATBOT
    // ==========================================

    @Override
    public FileUploadResponse uploadChatAttachment(
            MultipartFile file,
            String uploadedBy,
            String role
    ) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException(
                        "Vui lòng chọn tệp đính kèm!"
                );
            }

            if (file.getSize() > MAX_CHAT_FILE_SIZE) {
                throw new IllegalArgumentException(
                        "Dung lượng mỗi tệp không được vượt quá 10MB!"
                );
            }

            String originalName = sanitizeFilename(
                    file.getOriginalFilename()
            );

            String extension = getExtension(originalName);

            if (!CHAT_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException(
                        "Định dạng không hỗ trợ. "
                        + "Chỉ nhận PDF, DOCX, XLSX, XLS, CSV, "
                        + "JPG, PNG và GIF."
                );
            }

            byte[] bytes = file.getBytes();

            String contentType = validateChatFile(bytes, extension);

            ensureBucketExists();

            String objectName = "chat/"
                    + UUID.randomUUID()
                    + extension;

            uploadToMinio(objectName, contentType, bytes);

            StoredFile savedFile = saveMetadata(
                    originalName,
                    objectName,
                    contentType,
                    bytes.length,
                    uploadedBy
            );

            writeAuditLog(
                    uploadedBy,
                    role,
                    "CHAT_ATTACHMENT_UPLOADED",
                    "CHAT_ATTACHMENT",
                    savedFile,
                    "Tải tệp đính kèm chatbot lên MinIO"
            );

            return toUploadResponse(
                    savedFile,
                    "Tải tệp đính kèm thành công!"
            );

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể upload tệp đính kèm chatbot!",
                    e
            );
        }
    }

    // ==========================================
    // KIỂM TRA ĐỊNH DẠNG TỆP
    // ==========================================

    private String validateChatFile(
            byte[] bytes,
            String extension
    ) throws Exception {

        if (bytes == null || bytes.length == 0) {
            throw new IllegalArgumentException("Tệp rỗng!");
        }

        switch (extension) {

            case ".jpg":
            case ".jpeg":
            case ".png":
            case ".gif": {
                String imageType = detectImageType(bytes);

                if (imageType == null) {
                    throw new IllegalArgumentException(
                            "Dữ liệu ảnh không hợp lệ!"
                    );
                }

                BufferedImage image = ImageIO.read(
                        new ByteArrayInputStream(bytes)
                );

                if (image == null) {
                    throw new IllegalArgumentException(
                            "Không thể đọc dữ liệu ảnh!"
                    );
                }

                return imageType;
            }

            case ".pdf": {
                if (!startsWith(bytes, "%PDF-")) {
                    throw new IllegalArgumentException(
                            "Tệp PDF không hợp lệ!"
                    );
                }

                try (var document = Loader.loadPDF(bytes)) {
                    if (document.getNumberOfPages() <= 0) {
                        throw new IllegalArgumentException(
                                "PDF không có trang nội dung!"
                        );
                    }
                }

                return "application/pdf";
            }

            case ".docx": {
                if (!isZipFile(bytes)) {
                    throw new IllegalArgumentException(
                            "Tệp DOCX không hợp lệ!"
                    );
                }

                try (XWPFDocument document = new XWPFDocument(
                        new ByteArrayInputStream(bytes)
                )) {
                    // Đọc cấu trúc DOCX để xác thực tệp.
                    document.getParagraphs();
                }

                return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }

            case ".xlsx": {
                if (!isZipFile(bytes)) {
                    throw new IllegalArgumentException(
                            "Tệp XLSX không hợp lệ!"
                    );
                }

                validateWorkbook(bytes);

                return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }

            case ".xls": {
                if (!startsWith(bytes, new byte[]{
                        (byte) 0xD0, (byte) 0xCF,
                        0x11, (byte) 0xE0,
                        (byte) 0xA1, (byte) 0xB1,
                        0x1A, (byte) 0xE1
                })) {
                    throw new IllegalArgumentException(
                            "Tệp XLS không hợp lệ!"
                    );
                }

                validateWorkbook(bytes);

                return "application/vnd.ms-excel";
            }

            case ".csv": {
                validateCsv(bytes);
                return "text/csv";
            }

            default:
                throw new IllegalArgumentException(
                        "Định dạng tệp không được hỗ trợ!"
                );
        }
    }

    private void validateWorkbook(byte[] bytes) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(
                new ByteArrayInputStream(bytes)
        )) {
            if (workbook.getNumberOfSheets() <= 0) {
                throw new IllegalArgumentException(
                        "Bảng tính không có trang dữ liệu!"
                );
            }
        }
    }

    private void validateCsv(byte[] bytes)
            throws CharacterCodingException {

        String content = StandardCharsets.UTF_8
                .newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes))
                .toString();

        if (content.startsWith("\uFEFF")) {
            content = content.substring(1);
        }

        if (content.isBlank() || content.indexOf('\0') >= 0) {
            throw new IllegalArgumentException(
                    "Nội dung CSV không hợp lệ hoặc đang trống!"
            );
        }
    }

    private boolean startsWith(byte[] bytes, String header) {
        byte[] expected = header.getBytes(StandardCharsets.US_ASCII);

        if (bytes.length < expected.length) {
            return false;
        }

        for (int i = 0; i < expected.length; i++) {
            if (bytes[i] != expected[i]) {
                return false;
            }
        }

        return true;
    }

    private boolean startsWith(byte[] bytes, byte[] header) {
        if (bytes.length < header.length) {
            return false;
        }

        for (int i = 0; i < header.length; i++) {
            if (bytes[i] != header[i]) {
                return false;
            }
        }

        return true;
    }

    private boolean isZipFile(byte[] bytes) {
        return bytes.length >= 4
                && bytes[0] == 'P'
                && bytes[1] == 'K'
                && (
                    (bytes[2] == 3 && bytes[3] == 4)
                    || (bytes[2] == 5 && bytes[3] == 6)
                    || (bytes[2] == 7 && bytes[3] == 8)
                );
    }

    // ==========================================
    // ĐỌC TỆP THEO QUYỀN SỞ HỮU
    // ==========================================

    @Override
    public StoredFile getOwnedChatAttachment(
            String id,
            String uploadedBy
    ) {
        return storedFileRepository
                .findByIdAndUploadedByAndDeletedFalse(id, uploadedBy)
                .filter(file -> file.getObjectName() != null
                        && file.getObjectName().startsWith("chat/"))
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Không tìm thấy tệp hoặc bạn không có quyền truy cập!"
                        )
                );
    }

    @Override
    public byte[] readChatAttachment(StoredFile storedFile) {
        if (storedFile == null
                || storedFile.getObjectName() == null
                || !storedFile.getObjectName().startsWith("chat/")) {
            throw new IllegalArgumentException(
                    "Tệp đính kèm không hợp lệ!"
            );
        }

        if (storedFile.getBucketName() == null
                || storedFile.getBucketName().isBlank()) {
            throw new IllegalArgumentException(
                    "Thông tin lưu trữ tệp không hợp lệ!"
            );
        }

        try (InputStream inputStream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(storedFile.getBucketName())
                        .object(storedFile.getObjectName())
                        .build()
        );
             ByteArrayOutputStream outputStream =
                     new ByteArrayOutputStream()) {

            byte[] buffer = new byte[8192];
            int length;
            long total = 0;

            while ((length = inputStream.read(buffer)) != -1) {
                total += length;

                if (total > MAX_CHAT_FILE_SIZE) {
                    throw new IllegalArgumentException(
                            "Tệp vượt quá dung lượng cho phép!"
                    );
                }

                outputStream.write(buffer, 0, length);
            }

            return outputStream.toByteArray();

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException(
                    "Không thể đọc tệp đính kèm từ MinIO!",
                    e
            );
        }
    }

    // ==========================================
    // LẤY URL ẢNH
    // ==========================================

    
    @Override
    public FileUrlResponse getImageUrl(String id) {
        try {
            StoredFile storedFile = storedFileRepository
                    .findByIdAndDeletedFalse(id)
                    .orElseThrow(() ->
                            new IllegalArgumentException("Không tìm thấy ảnh!")
                    );

            // Không cho phép lấy URL của tệp đính kèm chatbot.
            if (storedFile.getObjectName() == null
                    || storedFile.getObjectName().isBlank()
                    || storedFile.getObjectName().startsWith("chat/")) {
                throw new IllegalArgumentException("Tệp không phải ảnh hợp lệ!");
            }

            // Chỉ cho phép các định dạng ảnh.
            String contentType = storedFile.getContentType();

            if (contentType == null
                    || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
                throw new IllegalArgumentException("Tệp không phải ảnh hợp lệ!");
            }

            if (storedFile.getBucketName() == null
                    || storedFile.getBucketName().isBlank()) {
                throw new IllegalArgumentException("Thông tin lưu trữ ảnh không hợp lệ!");
            }

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


    // ==========================================
    // DANH SÁCH ẢNH CỦA NGƯỜI DÙNG
    // ==========================================

    @Override
    public List<FileUploadResponse> getMyImages(String uploadedBy) {
        return storedFileRepository
                .findByUploadedByAndDeletedFalseOrderByCreatedAtDesc(
                        uploadedBy
                )
                .stream()
                .filter(file -> file.getObjectName() != null)
                .filter(file -> !file.getObjectName().startsWith("chat/"))
                .map(file -> toUploadResponse(
                        file,
                        "Ảnh đã được lưu"
                ))
                .toList();
    }

    // ==========================================
    // HÀM HỖ TRỢ MINIO
    // ==========================================

    private void ensureBucketExists() throws Exception {
        boolean exists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                        .bucket(bucketName)
                        .build()
        );

        if (!exists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build()
            );
        }
    }

    private void uploadToMinio(
            String objectName,
            String contentType,
            byte[] bytes
    ) throws Exception {

        try (InputStream inputStream =
                     new ByteArrayInputStream(bytes)) {

            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, bytes.length, -1)
                            .contentType(contentType)
                            .build()
            );
        }
    }

    private StoredFile saveMetadata(
            String originalName,
            String objectName,
            String contentType,
            long fileSize,
            String uploadedBy
    ) throws Exception {

        StoredFile storedFile = new StoredFile();

        storedFile.setOriginalName(originalName);
        storedFile.setBucketName(bucketName);
        storedFile.setObjectName(objectName);
        storedFile.setContentType(contentType);
        storedFile.setFileSize(fileSize);
        storedFile.setUploadedBy(uploadedBy);
        storedFile.setCreatedAt(LocalDateTime.now());
        storedFile.setDeleted(false);

        try {
            return storedFileRepository.save(storedFile);
        } catch (Exception e) {
            try {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectName)
                                .build()
                );
            } catch (Exception cleanupException) {
                e.addSuppressed(cleanupException);
            }

            throw e;
        }
    }

    private void writeAuditLog(
            String uploadedBy,
            String role,
            String action,
            String entityType,
            StoredFile file,
            String description
    ) {
        Map<String, Object> details = new HashMap<>();

        details.put("fileId", file.getId());
        details.put("originalName", file.getOriginalName());
        details.put("contentType", file.getContentType());
        details.put("fileSize", file.getFileSize());
        details.put("bucketName", file.getBucketName());

        auditLogService.createLog(
                uploadedBy,
                role,
                action,
                entityType,
                file.getId(),
                description,
                details
        );
    }

    private FileUploadResponse toUploadResponse(
            StoredFile file,
            String message
    ) {
        return new FileUploadResponse(
                file.getId(),
                file.getOriginalName(),
                file.getContentType(),
                file.getFileSize(),
                message
        );
    }

    private String sanitizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException(
                    "Tên tệp không hợp lệ!"
            );
        }

        String sanitized = filename
                .replace("\\", "/");

        sanitized = sanitized.substring(
                sanitized.lastIndexOf('/') + 1
        );

        if (sanitized.isBlank()) {
            throw new IllegalArgumentException(
                    "Tên tệp không hợp lệ!"
            );
        }

        return sanitized;
    }

    private String getExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');

        if (dotIndex < 0) {
            return "";
        }

        return filename.substring(dotIndex).toLowerCase(Locale.ROOT);
    }

    private String getImageExtension(String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            default -> throw new IllegalArgumentException(
                    "Định dạng ảnh không được hỗ trợ!"
            );
        };
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
            String header = new String(
                    bytes, 0, 6, StandardCharsets.US_ASCII
            );

            if (header.equals("GIF87a")
                    || header.equals("GIF89a")) {
                return "image/gif";
            }
        }

        return null;
    }
}
