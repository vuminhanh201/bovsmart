
package com.bovsmart.jwt.service;

import java.util.List;

import com.bovsmart.jwt.model.FeedingSchedule;
import com.bovsmart.jwt.model.FeedingRecord;

public interface FeedingService {

    // Lập lịch cho ăn
    FeedingSchedule createSchedule(
            String feedId,
            double plannedQuantity,
            String barnId,
            String assignedTo,
            java.time.LocalDate feedingDate,
            java.time.LocalTime feedingTime,
            String note,
            String createdBy
    );

    // Xem danh sách lịch cho ăn
    List<FeedingSchedule> getAllSchedules();

    // Xem lịch theo nhân viên
    List<FeedingSchedule> getSchedulesByAssignedTo(String assignedTo);

    // Xem lịch theo chuồng
    List<FeedingSchedule> getSchedulesByBarn(String barnId);

    // Ghi nhận lượng thức ăn thực tế
    FeedingRecord createFeedingRecord(
            String scheduleId,
            double actualQuantity,
            String note,
            String performedBy
    );

    // Xem danh sách bản ghi
    List<FeedingRecord> getAllRecords();

    // Xem bản ghi theo nhân viên
    List<FeedingRecord> getRecordsByPerformedBy(String performedBy);

    // Xác nhận bản ghi
    FeedingRecord approveRecord(
            String recordId,
            String reviewedBy,
            String reviewNote
    );

    // Từ chối bản ghi
    FeedingRecord rejectRecord(
            String recordId,
            String reviewedBy,
            String reviewNote
    );
}
