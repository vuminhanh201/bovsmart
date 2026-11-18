
package com.bovsmart.jwt.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.bovsmart.jwt.model.Feed;
import com.bovsmart.jwt.model.Barn;
import com.bovsmart.jwt.model.FeedingSchedule;
import com.bovsmart.jwt.model.FeedingRecord;
import com.bovsmart.jwt.repository.FeedRepository;
import com.bovsmart.jwt.repository.BarnRepository;
import com.bovsmart.jwt.repository.FeedingScheduleRepository;
import com.bovsmart.jwt.repository.FeedingRecordRepository;
import com.bovsmart.jwt.service.FeedingService;

@Service
public class FeedingServiceImpl implements FeedingService {

    private final FeedRepository feedRepository;
    private final BarnRepository barnRepository;
    private final FeedingScheduleRepository scheduleRepository;
    private final FeedingRecordRepository recordRepository;

    public FeedingServiceImpl(
            FeedRepository feedRepository,
            BarnRepository barnRepository,
            FeedingScheduleRepository scheduleRepository,
            FeedingRecordRepository recordRepository) {
        this.feedRepository = feedRepository;
        this.barnRepository = barnRepository;
        this.scheduleRepository = scheduleRepository;
        this.recordRepository = recordRepository;
    }

    @Override
    public FeedingSchedule createSchedule(
            String feedId, double plannedQuantity, String barnId,
            String assignedTo, java.time.LocalDate feedingDate,
            java.time.LocalTime feedingTime, String note, String createdBy) {

        if (plannedQuantity <= 0) {
            throw new RuntimeException("Số lượng thức ăn phải lớn hơn 0!");
        }

        Feed feed = feedRepository.findById(feedId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thức ăn!"));

        if (!"ACTIVE".equalsIgnoreCase(feed.getStatus())) {
            throw new RuntimeException("Thức ăn hiện không hoạt động!");
        }

        Barn barn = barnRepository.findById(barnId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy chuồng trại!"));

        if (assignedTo == null || assignedTo.trim().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn nhân viên phụ trách!");
        }

        if (feedingDate == null || feedingTime == null) {
            throw new RuntimeException("Vui lòng nhập ngày và giờ cho ăn!");
        }

        FeedingSchedule schedule = new FeedingSchedule();
        schedule.setScheduleCode("FEED-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        schedule.setFeedId(feed.getId());
        schedule.setFeedName(feed.getFeedName());
        schedule.setPlannedQuantity(plannedQuantity);
        schedule.setUnit(feed.getUnit());
        schedule.setBarnId(barn.getId());
        schedule.setBarnCode(barn.getCode());
        schedule.setAssignedTo(assignedTo);
        schedule.setFeedingDate(feedingDate);
        schedule.setFeedingTime(feedingTime);
        schedule.setNote(note);
        schedule.setStatus("SCHEDULED");
        schedule.setCreatedBy(createdBy);
        schedule.setCreatedAt(LocalDateTime.now());

        return scheduleRepository.save(schedule);
    }

    @Override
    public List<FeedingSchedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    @Override
    public List<FeedingSchedule> getSchedulesByAssignedTo(String assignedTo) {
        return scheduleRepository.findByAssignedTo(assignedTo);
    }

    @Override
    public List<FeedingSchedule> getSchedulesByBarn(String barnId) {
        return scheduleRepository.findByBarnId(barnId);
    }

    @Override
    public FeedingRecord createFeedingRecord(
            String scheduleId, double actualQuantity,
            String note, String performedBy) {

        if (actualQuantity <= 0) {
            throw new RuntimeException("Số lượng thức ăn thực tế phải lớn hơn 0!");
        }

        FeedingSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch cho ăn!"));

        if (!"SCHEDULED".equalsIgnoreCase(schedule.getStatus())) {
            throw new RuntimeException("Lịch cho ăn không còn ở trạng thái chờ thực hiện!");
        }

        if (performedBy == null || !performedBy.equalsIgnoreCase(schedule.getAssignedTo())) {
            throw new RuntimeException("Bạn không được phân công thực hiện lịch cho ăn này!");
        }

        List<FeedingRecord> existingRecords = recordRepository.findByScheduleId(scheduleId);

        boolean hasPendingOrApproved = existingRecords.stream()
                .anyMatch(record ->
                        "PENDING".equalsIgnoreCase(record.getRecordStatus())
                        || "APPROVED".equalsIgnoreCase(record.getRecordStatus()));

        if (hasPendingOrApproved) {
            throw new RuntimeException("Lịch này đã có phiếu ghi nhận đang chờ hoặc đã được duyệt!");
        }

        FeedingRecord record = new FeedingRecord();
        record.setScheduleId(schedule.getId());
        record.setScheduleCode(schedule.getScheduleCode());
        record.setFeedId(schedule.getFeedId());
        record.setFeedName(schedule.getFeedName());
        record.setBarnId(schedule.getBarnId());
        record.setBarnCode(schedule.getBarnCode());
        record.setPlannedQuantity(schedule.getPlannedQuantity());
        record.setActualQuantity(actualQuantity);
        record.setUnit(schedule.getUnit());
        record.setPerformedBy(performedBy);
        record.setNote(note);
        record.setRecordStatus("PENDING");
        record.setPerformedAt(LocalDateTime.now());

        return recordRepository.save(record);
    }

    @Override
    public List<FeedingRecord> getAllRecords() {
        return recordRepository.findAll();
    }

    @Override
    public List<FeedingRecord> getRecordsByPerformedBy(String performedBy) {
        return recordRepository.findByPerformedBy(performedBy);
    }

    @Override
    public FeedingRecord approveRecord(
            String recordId, String reviewedBy, String reviewNote) {

        FeedingRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu cho ăn!"));

        if (!"PENDING".equalsIgnoreCase(record.getRecordStatus())) {
            throw new RuntimeException("Chỉ được duyệt phiếu đang chờ xác nhận!");
        }

        if (record.getPerformedBy() != null
                && record.getPerformedBy().equalsIgnoreCase(reviewedBy)) {
            throw new RuntimeException("Người thực hiện không được tự duyệt phiếu!");
        }

        Feed feed = feedRepository.findById(record.getFeedId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thức ăn trong kho!"));

        if (feed.getQuantity() < record.getActualQuantity()) {
            throw new RuntimeException("Số lượng tồn kho không đủ để xác nhận phiếu!");
        }

        feed.setQuantity(feed.getQuantity() - record.getActualQuantity());
        feedRepository.save(feed);

        record.setRecordStatus("APPROVED");
        record.setReviewedBy(reviewedBy);
        record.setReviewNote(reviewNote);
        record.setReviewedAt(LocalDateTime.now());

        FeedingSchedule schedule = scheduleRepository.findById(record.getScheduleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch cho ăn!"));

        schedule.setStatus("COMPLETED");
        scheduleRepository.save(schedule);

        return recordRepository.save(record);
    }

    @Override
    public FeedingRecord rejectRecord(
            String recordId, String reviewedBy, String reviewNote) {

        FeedingRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu cho ăn!"));

        if (!"PENDING".equalsIgnoreCase(record.getRecordStatus())) {
            throw new RuntimeException("Chỉ được từ chối phiếu đang chờ xác nhận!");
        }

        if (record.getPerformedBy() != null
                && record.getPerformedBy().equalsIgnoreCase(reviewedBy)) {
            throw new RuntimeException("Người thực hiện không được tự từ chối phiếu!");
        }

        record.setRecordStatus("REJECTED");
        record.setReviewedBy(reviewedBy);
        record.setReviewNote(reviewNote);
        record.setReviewedAt(LocalDateTime.now());

        return recordRepository.save(record);
    }
}
