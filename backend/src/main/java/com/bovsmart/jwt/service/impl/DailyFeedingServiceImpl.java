
package com.bovsmart.jwt.service.impl;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.bovsmart.jwt.dto.request.DailyRationRequestDTO;
import com.bovsmart.jwt.dto.request.FeedingShiftRecordRequestDTO;
import com.bovsmart.jwt.model.Barn;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.DailyRation;
import com.bovsmart.jwt.model.Feed;
import com.bovsmart.jwt.model.FeedingShiftRecord;
import com.bovsmart.jwt.model.FeedingShiftSchedule;
import com.bovsmart.jwt.repository.BarnRepository;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.DailyRationRepository;
import com.bovsmart.jwt.repository.FeedRepository;
import com.bovsmart.jwt.repository.FeedingShiftRecordRepository;
import com.bovsmart.jwt.repository.FeedingShiftScheduleRepository;
import com.bovsmart.jwt.service.DailyFeedingService;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.repository.UserRepository;

@Service
public class DailyFeedingServiceImpl implements DailyFeedingService {

    private final FeedRepository feedRepository;
    private final BarnRepository barnRepository;
    private final CattleRepository cattleRepository;
    private final DailyRationRepository dailyRationRepository;
    private final FeedingShiftScheduleRepository shiftScheduleRepository;
    private final FeedingShiftRecordRepository shiftRecordRepository;
    private final UserRepository userRepository;

    public DailyFeedingServiceImpl(
            FeedRepository feedRepository,
            BarnRepository barnRepository,
            CattleRepository cattleRepository,
            DailyRationRepository dailyRationRepository,
            FeedingShiftScheduleRepository shiftScheduleRepository,
            FeedingShiftRecordRepository shiftRecordRepository,
            UserRepository userRepository) {

        this.feedRepository = feedRepository;
        this.barnRepository = barnRepository;
        this.cattleRepository = cattleRepository;
        this.dailyRationRepository = dailyRationRepository;
        this.shiftScheduleRepository = shiftScheduleRepository;
        this.shiftRecordRepository = shiftRecordRepository;
        this.userRepository = userRepository;
    }

        
    @Override
    public List<DailyRation> createDailyRation(
            DailyRationRequestDTO request,
            String createdBy) {

        // 1. Kiểm tra nhóm chuồng
        if (request.getGroupCode() == null
                || request.getGroupCode().isBlank()) {
            throw new RuntimeException("Vui lòng chọn nhóm chuồng!");
        }

        String groupCode = request.getGroupCode().trim().toUpperCase();

        Set<String> barnCodes = switch (groupCode) {
            case "A" -> Set.of("A1", "A2", "A3", "A4", "A5");
            case "B" -> Set.of("B1", "B2", "B3");
            case "C" -> Set.of("C1", "C2");
            default -> throw new RuntimeException("Nhóm chuồng không hợp lệ!");
        };

        // 2. Kiểm tra thời gian lập khẩu phần
        if (request.getPeriodType() == null
                || request.getStartDate() == null) {
            throw new RuntimeException("Vui lòng chọn thời gian lập khẩu phần!");
        }

        String periodType = request.getPeriodType().trim().toUpperCase();

        LocalDate startDate = request.getStartDate();
        LocalDate endDate;

        if (startDate.isBefore(LocalDate.now())) {
            throw new RuntimeException(
                    "Không thể lập khẩu phần cho ngày trong quá khứ!");
        }

        if ("DAY".equals(periodType)) {
            endDate = startDate;
        } else if ("WEEK".equals(periodType)) {
            endDate = request.getEndDate();

            if (endDate == null) {
                throw new RuntimeException("Vui lòng chọn ngày kết thúc tuần!");
            }

            if (ChronoUnit.DAYS.between(startDate, endDate) != 6) {
                throw new RuntimeException(
                        "Khoảng thời gian một tuần phải gồm đúng 7 ngày!");
            }
        } else {
            throw new RuntimeException("Loại thời gian không hợp lệ!");
        }

        // 3. Kiểm tra danh sách thức ăn
        if (request.getFeeds() == null || request.getFeeds().isEmpty()) {
            throw new RuntimeException(
                    "Khẩu phần phải có ít nhất một loại thức ăn!");
        }

        List<DailyRation.RationFeedItem> rationFeeds = new ArrayList<>();
        Map<String, Feed> selectedFeeds = new HashMap<>();

        for (DailyRationRequestDTO.FeedItemDTO item : request.getFeeds()) {

            if (item.getFeedId() == null || item.getFeedId().isBlank()) {
                throw new RuntimeException("Mã thức ăn không hợp lệ!");
            }

            if (item.getDailyQuantityPerHead() <= 0) {
                throw new RuntimeException(
                        "Lượng thức ăn mỗi con phải lớn hơn 0!");
            }

            if (selectedFeeds.containsKey(item.getFeedId())) {
                throw new RuntimeException(
                        "Không được chọn trùng một loại thức ăn!");
            }

            Feed feed = feedRepository.findById(item.getFeedId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy thức ăn: " + item.getFeedId()));

            if (!"ACTIVE".equalsIgnoreCase(feed.getStatus())) {
                throw new RuntimeException(
                        "Thức ăn " + feed.getFeedName()
                        + " hiện không hoạt động!");
            }

            selectedFeeds.put(feed.getId(), feed);

            DailyRation.RationFeedItem rationItem =
                    new DailyRation.RationFeedItem();

            rationItem.setFeedId(feed.getId());
            rationItem.setFeedName(feed.getFeedName());
            rationItem.setDailyQuantityPerHead(
                    item.getDailyQuantityPerHead());
            rationItem.setUnit(feed.getUnit());

            rationFeeds.add(rationItem);
        }

        // 4. Tìm các chuồng thuộc nhóm đã chọn
        List<Barn> barns = barnRepository.findAll()
                .stream()
                .filter(barn -> barn.getCode() != null
                        && barnCodes.contains(
                                barn.getCode().trim().toUpperCase()))
                .collect(Collectors.toList());

        if (barns.isEmpty()) {
            throw new RuntimeException(
                    "Không tìm thấy chuồng thuộc nhóm " + groupCode + "!");
        }

        // 5. Kiểm tra nhân viên được phân công cho từng chuồng
        Map<String, String> staffByBarn = new HashMap<>();

        List<User> users = userRepository.findAll();

        for (Barn barn : barns) {

            List<User> assignedStaff = users.stream()
                    .filter(User::isEnabled)
                    .filter(user -> user.getRoles() != null
                            && user.getRoles().contains("ROLE_STAFF"))
                    .filter(user -> user.getAssignedBarns() != null
                            && user.getAssignedBarns().contains(barn.getId()))
                    .filter(user -> user.getEmail() != null
                            && !user.getEmail().isBlank())
                    .collect(Collectors.toList());

            if (assignedStaff.isEmpty()) {
                throw new RuntimeException(
                        "Chuồng " + barn.getCode()
                        + " chưa được phân công nhân viên STAFF!");
            }

            if (assignedStaff.size() > 1) {
                throw new RuntimeException(
                        "Chuồng " + barn.getCode()
                        + " có nhiều nhân viên STAFF được phân công. "
                        + "Vui lòng kiểm tra lại phân công nhân sự!");
            }

            staffByBarn.put(
                    barn.getCode(),
                    assignedStaff.get(0).getEmail());
        }

        // 6. Kiểm tra số lượng bò và khẩu phần trùng trước khi tạo
        Map<String, Integer> cattleCountByBarn = new HashMap<>();

        for (Barn barn : barns) {

            List<Cattle> cattleInBarn =
                    cattleRepository.findByPenId(barn.getCode());

            int cattleCount = (int) cattleInBarn.stream()
                    .filter(cattle -> {
                        String status = cattle.getStatus();

                        return status == null
                                || (!status.equalsIgnoreCase("DA_XUAT_BAN")
                                && !status.equalsIgnoreCase("SOLD"));
                    })
                    .count();

            if (cattleCount <= 0) {
                throw new RuntimeException(
                        "Chuồng " + barn.getCode()
                        + " hiện không có bò cần lập khẩu phần!");
            }

            cattleCountByBarn.put(barn.getCode(), cattleCount);

            LocalDate checkDate = startDate;

            while (!checkDate.isAfter(endDate)) {

                if (dailyRationRepository.existsByBarnIdAndFeedingDate(
                        barn.getId(), checkDate)) {
                    throw new RuntimeException(
                            "Chuồng " + barn.getCode()
                            + " đã có khẩu phần ngày " + checkDate + "!");
                }

                checkDate = checkDate.plusDays(1);
            }
        }

        // 7. Tạo khẩu phần theo từng chuồng và từng ngày
        List<DailyRation> createdRations = new ArrayList<>();

        // Lưu ID để chỉ rollback dữ liệu vừa tạo
        List<String> createdRationIds = new ArrayList<>();
        List<String> createdShiftIds = new ArrayList<>();

        try {

            for (Barn barn : barns) {

                LocalDate feedingDate = startDate;

                while (!feedingDate.isAfter(endDate)) {

                    DailyRation ration = new DailyRation();

                    ration.setRationCode("RATION-"
                            + UUID.randomUUID().toString()
                            .substring(0, 8).toUpperCase());

                    ration.setBarnId(barn.getId());
                    ration.setBarnCode(barn.getCode());
                    ration.setFeedingDate(feedingDate);
                    ration.setCattleCount(
                            cattleCountByBarn.get(barn.getCode()));
                    ration.setFeeds(new ArrayList<>(rationFeeds));
                    ration.setStatus("ACTIVE");
                    ration.setCreatedBy(createdBy);
                    ration.setCreatedAt(LocalDateTime.now());

                    DailyRation savedRation =
                            dailyRationRepository.save(ration);

                    createdRationIds.add(savedRation.getId());

                    String assignedTo = staffByBarn.get(barn.getCode());

                    // Ca sáng: 06:00 - 50%
                    FeedingShiftSchedule morningShift = createShift(
                            savedRation,
                            assignedTo,
                            "MORNING",
                            "Ca sáng",
                            LocalTime.of(6, 0),
                            0.50
                    );

                    createdShiftIds.add(morningShift.getId());

                    // Ca chiều: 18:00 - 50%
                    FeedingShiftSchedule eveningShift = createShift(
                            savedRation,
                            assignedTo,
                            "EVENING",
                            "Ca chiều",
                            LocalTime.of(18, 0),
                            0.50
                    );

                    createdShiftIds.add(eveningShift.getId());

                    createdRations.add(savedRation);

                    feedingDate = feedingDate.plusDays(1);
                }
            }

        } catch (RuntimeException exception) {

            rollbackCreatedRecords(
                    createdRationIds,
                    createdShiftIds,
                    exception
            );

            throw exception;
        }

        return createdRations;
    }


    private FeedingShiftSchedule createShift(
            DailyRation ration,
            String assignedTo,
            String shiftCode,
            String shiftName,
            LocalTime feedingTime,
            double ratio) {

        FeedingShiftSchedule schedule = new FeedingShiftSchedule();

        schedule.setDailyRationId(ration.getId());
        schedule.setScheduleCode("SHIFT-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        schedule.setBarnId(ration.getBarnId());
        schedule.setBarnCode(ration.getBarnCode());
        schedule.setFeedingDate(ration.getFeedingDate());

        schedule.setShiftCode(shiftCode);
        schedule.setShiftName(shiftName);
        schedule.setFeedingTime(feedingTime);
        schedule.setRatio(ratio);

        schedule.setAssignedTo(assignedTo);
        schedule.setStatus("SCHEDULED");
        schedule.setCreatedBy(ration.getCreatedBy());
        schedule.setCreatedAt(LocalDateTime.now());

        List<FeedingShiftSchedule.ShiftFeedItem> shiftFeeds =
                new ArrayList<>();

        for (DailyRation.RationFeedItem item : ration.getFeeds()) {

            double plannedQuantity = item.getDailyQuantityPerHead()
                    * ration.getCattleCount() * ratio;

            FeedingShiftSchedule.ShiftFeedItem shiftItem =
                    new FeedingShiftSchedule.ShiftFeedItem();

            shiftItem.setFeedId(item.getFeedId());
            shiftItem.setFeedName(item.getFeedName());
            shiftItem.setPlannedQuantity(
                    Math.round(plannedQuantity * 100.0) / 100.0);
            shiftItem.setUnit(item.getUnit());

            shiftFeeds.add(shiftItem);
        }

        schedule.setFeeds(shiftFeeds);
        return shiftScheduleRepository.save(schedule);
    }

    private void rollbackCreatedRecords(
            List<String> rationIds,
            List<String> shiftIds,
            RuntimeException originalException) {

        // Xóa toàn bộ lịch ca thuộc các khẩu phần vừa tạo
        for (String rationId : rationIds) {
            try {
                shiftScheduleRepository.deleteByDailyRationId(rationId);
            } catch (RuntimeException rollbackException) {
                originalException.addSuppressed(rollbackException);
            }
        }

        // Xóa bổ sung theo ID lịch ca
        try {
            if (!shiftIds.isEmpty()) {
                shiftScheduleRepository.deleteByIdIn(shiftIds);
            }
        } catch (RuntimeException rollbackException) {
            originalException.addSuppressed(rollbackException);
        }

        // Xóa khẩu phần
        try {
            if (!rationIds.isEmpty()) {
                dailyRationRepository.deleteByIdIn(rationIds);
            }
        } catch (RuntimeException rollbackException) {
            originalException.addSuppressed(rollbackException);
        }
    }

    // 2. TRUY VẤN KHẨU PHẦN VÀ LỊCH CA
    @Override
    public List<DailyRation> getAllDailyRations() {
        return dailyRationRepository.findAll();
    }

    @Override
    public List<FeedingShiftSchedule> getMyShiftSchedules(String assignedTo) {
        return shiftScheduleRepository.findByAssignedTo(assignedTo);
    }

    @Override
    public List<FeedingShiftSchedule> getShiftSchedulesByBarn(String barnId) {
        return shiftScheduleRepository.findAll()
                .stream()
                .filter(schedule -> barnId.equals(schedule.getBarnId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<FeedingShiftSchedule> getAllShiftSchedules() {
        return shiftScheduleRepository.findAll();
    }

    // 3. NHÂN VIÊN GHI NHẬN THỰC TẾ
    @Override
    public FeedingShiftRecord createShiftRecord(
            FeedingShiftRecordRequestDTO request,
            String performedBy) {

        if (request.getShiftScheduleId() == null
                || request.getShiftScheduleId().isBlank()) {
            throw new RuntimeException("Vui lòng chọn lịch cho ăn!");
        }

        if (request.getFeeds() == null || request.getFeeds().isEmpty()) {
            throw new RuntimeException("Vui lòng nhập lượng thức ăn thực tế!");
        }

        FeedingShiftSchedule schedule =
                shiftScheduleRepository.findById(request.getShiftScheduleId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch cho ăn!"));

        if (!performedBy.equals(schedule.getAssignedTo())) {
            throw new RuntimeException("Bạn không được phân công thực hiện lịch cho ăn này!");
        }

        if (!"SCHEDULED".equalsIgnoreCase(schedule.getStatus())) {
            throw new RuntimeException("Lịch cho ăn không còn ở trạng thái có thể ghi nhận!");
        }

        List<FeedingShiftRecord> existingRecords =
                shiftRecordRepository.findByShiftScheduleId(schedule.getId());

        boolean hasActiveRecord = existingRecords.stream()
                .anyMatch(record ->
                        "PENDING".equalsIgnoreCase(record.getRecordStatus())
                        || "APPROVED".equalsIgnoreCase(record.getRecordStatus()));

        if (hasActiveRecord) {
            throw new RuntimeException(
                    "Lịch này đã có phiếu đang chờ duyệt hoặc đã được duyệt!");
        }

        Map<String, FeedingShiftSchedule.ShiftFeedItem> plannedFeeds =
                new HashMap<>();

        for (FeedingShiftSchedule.ShiftFeedItem item : schedule.getFeeds()) {
            plannedFeeds.put(item.getFeedId(), item);
        }

        List<FeedingShiftRecord.FeedActualItem> actualFeeds =
                new ArrayList<>();

        Map<String, Boolean> submittedIds = new HashMap<>();

        for (FeedingShiftRecordRequestDTO.FeedActualItemDTO item : request.getFeeds()) {

            if (item.getFeedId() == null || item.getFeedId().isBlank()
                    || item.getActualQuantity() <= 0) {
                throw new RuntimeException("Thông tin lượng thức ăn không hợp lệ!");
            }

            if (submittedIds.containsKey(item.getFeedId())) {
                throw new RuntimeException("Không được nhập trùng loại thức ăn!");
            }

            submittedIds.put(item.getFeedId(), true);

            FeedingShiftSchedule.ShiftFeedItem planned =
                    plannedFeeds.get(item.getFeedId());

            if (planned == null) {
                throw new RuntimeException("Thức ăn không thuộc khẩu phần của ca này!");
            }

            FeedingShiftRecord.FeedActualItem actual =
                    new FeedingShiftRecord.FeedActualItem();

            actual.setFeedId(planned.getFeedId());
            actual.setFeedName(planned.getFeedName());
            actual.setPlannedQuantity(planned.getPlannedQuantity());
            actual.setActualQuantity(item.getActualQuantity());
            actual.setUnit(planned.getUnit());

            actualFeeds.add(actual);
        }

        if (actualFeeds.size() != plannedFeeds.size()) {
            throw new RuntimeException(
                    "Vui lòng ghi nhận đầy đủ các loại thức ăn trong lịch!");
        }

        FeedingShiftRecord record = new FeedingShiftRecord();

        record.setShiftScheduleId(schedule.getId());
        record.setDailyRationId(schedule.getDailyRationId());
        record.setScheduleCode(schedule.getScheduleCode());

        record.setBarnId(schedule.getBarnId());
        record.setBarnCode(schedule.getBarnCode());
        record.setFeedingDate(schedule.getFeedingDate());

        record.setShiftCode(schedule.getShiftCode());
        record.setShiftName(schedule.getShiftName());

        record.setPerformedBy(performedBy);
        record.setNote(request.getNote());
        record.setFeeds(actualFeeds);

        record.setRecordStatus("PENDING");
        record.setPerformedAt(LocalDateTime.now());

        return shiftRecordRepository.save(record);
    }

    // 4. TRUY VẤN PHIẾU GHI NHẬN
    @Override
    public List<FeedingShiftRecord> getAllShiftRecords() {
        return shiftRecordRepository.findAll();
    }

    @Override
    public List<FeedingShiftRecord> getMyShiftRecords(String performedBy) {
        return shiftRecordRepository.findByPerformedBy(performedBy);
    }

    // 4.1. NHẬT KÝ CHO ĂN ĐÃ ĐƯỢC DUYỆT
    @Override
    public List<FeedingShiftRecord> getApprovedFeedingDiary(
            String barnId,
            LocalDate fromDate,
            LocalDate toDate,
            String keyword) {

        if (fromDate != null && toDate != null
                && fromDate.isAfter(toDate)) {
            throw new RuntimeException(
                    "Ngày bắt đầu không được sau ngày kết thúc!");
        }

        String normalizedKeyword = keyword == null
                ? ""
                : keyword.trim().toLowerCase();

        return shiftRecordRepository.findByRecordStatus("APPROVED")
                .stream()

                // Lọc theo chuồng
                .filter(record -> barnId == null || barnId.isBlank()
                        || barnId.equals(record.getBarnId()))

                // Lọc từ ngày
                .filter(record -> fromDate == null
                        || (record.getFeedingDate() != null
                        && !record.getFeedingDate().isBefore(fromDate)))

                // Lọc đến ngày
                .filter(record -> toDate == null
                        || (record.getFeedingDate() != null
                        && !record.getFeedingDate().isAfter(toDate)))

                // Tìm kiếm
                .filter(record -> {
                    if (normalizedKeyword.isBlank()) {
                        return true;
                    }

                    return containsKeyword(record.getBarnCode(), normalizedKeyword)
                            || containsKeyword(record.getScheduleCode(), normalizedKeyword)
                            || containsKeyword(record.getShiftName(), normalizedKeyword)
                            || containsKeyword(record.getPerformedBy(), normalizedKeyword)
                            || containsKeyword(record.getNote(), normalizedKeyword);
                })

                // Ngày mới nhất lên trước
                .sorted((a, b) -> {
                    if (a.getFeedingDate() == null) return 1;
                    if (b.getFeedingDate() == null) return -1;
                    return b.getFeedingDate().compareTo(a.getFeedingDate());
                })

                .collect(Collectors.toList());
    }

    // Kiểm tra từ khóa
    private boolean containsKeyword(String value, String keyword) {
        return value != null
                && value.toLowerCase().contains(keyword);
    }

    // 5. QUẢN LÝ DUYỆT PHIẾU
    @Override
    public FeedingShiftRecord approveShiftRecord(
            String recordId,
            String reviewedBy,
            String reviewNote) {

        FeedingShiftRecord record =
                shiftRecordRepository.findById(recordId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu cho ăn!"));

        if (!"PENDING".equalsIgnoreCase(record.getRecordStatus())) {
            throw new RuntimeException("Phiếu không ở trạng thái chờ duyệt!");
        }

        if (reviewedBy.equals(record.getPerformedBy())) {
            throw new RuntimeException("Người thực hiện không được tự duyệt phiếu!");
        }

        FeedingShiftSchedule schedule =
                shiftScheduleRepository.findById(record.getShiftScheduleId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch cho ăn!"));

        if (!"SCHEDULED".equalsIgnoreCase(schedule.getStatus())) {
            throw new RuntimeException("Lịch cho ăn đã được xử lý trước đó!");
        }

        Map<String, Feed> feedsToUpdate = new HashMap<>();

        for (FeedingShiftRecord.FeedActualItem item : record.getFeeds()) {

            Feed feed = feedRepository.findById(item.getFeedId())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy thức ăn: " + item.getFeedName()));

            if (feed.getQuantity() < item.getActualQuantity()) {
                throw new RuntimeException(
                        "Kho không đủ " + feed.getFeedName()
                        + ". Tồn kho: " + feed.getQuantity()
                        + ", cần: " + item.getActualQuantity());
            }

            feedsToUpdate.put(feed.getId(), feed);
        }

        for (FeedingShiftRecord.FeedActualItem item : record.getFeeds()) {

            Feed feed = feedsToUpdate.get(item.getFeedId());

            feed.setQuantity(feed.getQuantity() - item.getActualQuantity());

            feedRepository.save(feed);
        }

        record.setRecordStatus("APPROVED");
        record.setReviewedBy(reviewedBy);
        record.setReviewNote(reviewNote);
        record.setReviewedAt(LocalDateTime.now());

        FeedingShiftRecord savedRecord = shiftRecordRepository.save(record);

        schedule.setStatus("COMPLETED");
        shiftScheduleRepository.save(schedule);

        return savedRecord;
    }

    // 6. QUẢN LÝ TỪ CHỐI PHIẾU
    @Override
    public FeedingShiftRecord rejectShiftRecord(
            String recordId,
            String reviewedBy,
            String reviewNote) {

        FeedingShiftRecord record =
                shiftRecordRepository.findById(recordId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu cho ăn!"));

        if (!"PENDING".equalsIgnoreCase(record.getRecordStatus())) {
            throw new RuntimeException("Chỉ được từ chối phiếu đang chờ duyệt!");
    
        }

        if (reviewedBy.equals(record.getPerformedBy())) {
            throw new RuntimeException("Người thực hiện không được tự từ chối phiếu!");
        }

        record.setRecordStatus("REJECTED");
        record.setReviewedBy(reviewedBy);
        record.setReviewNote(reviewNote);
        record.setReviewedAt(LocalDateTime.now());

        return shiftRecordRepository.save(record);
    }
}
