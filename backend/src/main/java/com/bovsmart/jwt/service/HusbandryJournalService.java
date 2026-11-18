
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.HusbandryJournalRequest;
import com.bovsmart.jwt.model.HusbandryJournal;

import java.util.List;

public interface HusbandryJournalService {

    // Thêm nhật ký chăn nuôi
    HusbandryJournal createJournal(
            HusbandryJournalRequest request,
            String performedBy
    );

    // Cập nhật nhật ký
    HusbandryJournal updateJournal(
            String id,
            HusbandryJournalRequest request,
            String updatedBy,
            boolean isFarmManager
    );

    // Lấy toàn bộ nhật ký
    List<HusbandryJournal> getAllJournals();

    // Lấy nhật ký của người đang đăng nhập
    List<HusbandryJournal> getMyJournals(String performedBy);

    // Tra cứu nhật ký theo bò
    List<HusbandryJournal> getJournalsByCattleId(String cattleId);

    // Tra cứu nhật ký theo chuồng
    List<HusbandryJournal> getJournalsByBarnId(String barnId);

    // Xem chi tiết nhật ký
    HusbandryJournal getJournalById(String id);
}
