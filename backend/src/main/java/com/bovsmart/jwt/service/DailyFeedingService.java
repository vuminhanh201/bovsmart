
package com.bovsmart.jwt.service;

import java.util.List;
import java.time.LocalDate;

import com.bovsmart.jwt.dto.request.DailyRationRequestDTO;
import com.bovsmart.jwt.dto.request.FeedingShiftRecordRequestDTO;
import com.bovsmart.jwt.model.DailyRation;
import com.bovsmart.jwt.model.FeedingShiftSchedule;
import com.bovsmart.jwt.model.FeedingShiftRecord;

public interface DailyFeedingService {

    // Tạo khẩu phần theo nhóm chuồng và khoảng thời gian
    // Tự động chia thành 2 ca: 06:00 và 18:00
    List<DailyRation> createDailyRation(
            DailyRationRequestDTO request,
            String createdBy
    );

    // Quản lý xem toàn bộ khẩu phần ngày
    List<DailyRation> getAllDailyRations();

    // Nhân viên xem lịch ca được giao
    List<FeedingShiftSchedule> getMyShiftSchedules(String assignedTo);

    // Xem lịch ca theo chuồng
    List<FeedingShiftSchedule> getShiftSchedulesByBarn(String barnId);

    // Quản lý xem toàn bộ lịch ca
    List<FeedingShiftSchedule> getAllShiftSchedules();

    // Nhân viên ghi nhận lượng thức ăn thực tế
    FeedingShiftRecord createShiftRecord(
            FeedingShiftRecordRequestDTO request,
            String performedBy
    );

    // Quản lý xem toàn bộ phiếu ghi nhận
    List<FeedingShiftRecord> getAllShiftRecords();

    // Nhân viên xem phiếu do mình thực hiện
    List<FeedingShiftRecord> getMyShiftRecords(String performedBy);

    // Quản lý duyệt phiếu
    FeedingShiftRecord approveShiftRecord(
            String recordId,
            String reviewedBy,
            String reviewNote
    );

    // Quản lý từ chối phiếu
    FeedingShiftRecord rejectShiftRecord(
            String recordId,
            String reviewedBy,
            String reviewNote
    );

    // Nhật ký cho ăn: chỉ lấy kết quả đã được quản lý duyệt
    List<FeedingShiftRecord> getApprovedFeedingDiary(
                String barnId,
                LocalDate fromDate,
                LocalDate toDate,
                String keyword
);
}
