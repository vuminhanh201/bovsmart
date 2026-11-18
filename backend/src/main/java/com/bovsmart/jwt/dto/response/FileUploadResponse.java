
package com.bovsmart.jwt.dto.response;

public class FileUploadResponse {

    private String id;
    private String originalName;
    private String contentType;
    private long fileSize;
    private String message;

    public FileUploadResponse() {
    }

    public FileUploadResponse(
            String id,
            String originalName,
            String contentType,
            long fileSize,
            String message
    ) {
        this.id = id;
        this.originalName = originalName;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.message = message;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOriginalName() {
        return originalName;
    }

    public void setOriginalName(String originalName) {
        this.originalName = originalName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
