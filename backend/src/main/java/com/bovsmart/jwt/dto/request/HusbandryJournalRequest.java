
package com.bovsmart.jwt.dto.request;

import java.time.LocalDateTime;

public class HusbandryJournalRequest {

    private String cattleId;

    private String barnId;

    private String workType;

    private String title;

    private String content;

    private LocalDateTime performedAt;

    public String getCattleId() {
        return cattleId;
    }

    public void setCattleId(String cattleId) {
        this.cattleId = cattleId;
    }

    public String getBarnId() {
        return barnId;
    }

    public void setBarnId(String barnId) {
        this.barnId = barnId;
    }

    public String getWorkType() {
        return workType;
    }

    public void setWorkType(String workType) {
        this.workType = workType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getPerformedAt() {
        return performedAt;
    }

    public void setPerformedAt(LocalDateTime performedAt) {
        this.performedAt = performedAt;
    }
}
