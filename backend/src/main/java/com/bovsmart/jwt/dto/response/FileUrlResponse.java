
package com.bovsmart.jwt.dto.response;

public class FileUrlResponse {

    private String id;
    private String url;
    private long expiresInSeconds;

    public FileUrlResponse() {
    }

    public FileUrlResponse(String id, String url, long expiresInSeconds) {
        this.id = id;
        this.url = url;
        this.expiresInSeconds = expiresInSeconds;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public long getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(long expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }
}
