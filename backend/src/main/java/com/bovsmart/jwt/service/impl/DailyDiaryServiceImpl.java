
package com.bovsmart.jwt.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bovsmart.jwt.dto.request.DailyDiaryRequest;
import com.bovsmart.jwt.model.DailyDiary;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.repository.DailyDiaryRepository;
import com.bovsmart.jwt.repository.UserRepository;
import com.bovsmart.jwt.service.DailyDiaryService;

@Service
public class DailyDiaryServiceImpl implements DailyDiaryService {

    private final DailyDiaryRepository diaryRepository;
    private final UserRepository userRepository;

    public DailyDiaryServiceImpl(
            DailyDiaryRepository diaryRepository,
            UserRepository userRepository) {
        this.diaryRepository = diaryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public DailyDiary createDiary(
            DailyDiaryRequest request,
            String userId) {

        validateRequest(request);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy người dùng"));

        if (diaryRepository.existsByAuthorIdAndDateAndShift(
                userId, request.getDate(), request.getShift())) {
            throw new IllegalArgumentException(
                    "Bạn đã tạo nhật ký cho ca này trong ngày");
        }

        DailyDiary diary = new DailyDiary();

        diary.setDate(request.getDate());
        diary.setShift(request.getShift());

        // Thông tin người tạo lấy từ tài khoản đăng nhập
        diary.setAuthorId(user.getId());
        diary.setAuthorName(user.getFullName());
        diary.setAuthorRole(getRole(user));

        diary.setGeneralObservations(request.getGeneralObservations());
        diary.setWeather(request.getWeather());
        diary.setTempAvg(request.getTempAvg());

        List<DailyDiary.PenActivity> activities =
                request.getPenActivities().stream().map(item -> {
                    DailyDiary.PenActivity activity =
                            new DailyDiary.PenActivity();

                    activity.setPenId(item.getPenId());
                    activity.setPenName(item.getPenName());
                    activity.setCleaned(item.isCleaned());
                    activity.setWaterChecked(item.isWaterChecked());
                    activity.setFeedEatenPercentage(
                            item.getFeedEatenPercentage());
                    activity.setUnusualBehavior(item.getUnusualBehavior());

                    return activity;
                }).toList();

        diary.setPenActivities(activities);

        LocalDateTime now = LocalDateTime.now();
        diary.setCreatedAt(now);
        diary.setUpdatedAt(now);

        return diaryRepository.save(diary);
    }

    @Override
    public List<DailyDiary> getAllDiaries() {
        return diaryRepository.findAllByOrderByDateDesc();
    }

    @Override
    public List<DailyDiary> getMyDiaries(String userId) {
        return diaryRepository.findByAuthorIdOrderByDateDesc(userId);
    }

    @Override
    public DailyDiary getDiaryById(String diaryId) {
        return diaryRepository.findById(diaryId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy nhật ký"));
    }

    @Override
    public DailyDiary verifyDiary(
            String diaryId,
            String managerName) {

        DailyDiary diary = getDiaryById(diaryId);

        if (diary.getVerifiedByManager() != null
                && !diary.getVerifiedByManager().isBlank()) {
            throw new IllegalArgumentException(
                    "Nhật ký này đã được xác nhận");
        }

        diary.setVerifiedByManager(managerName);
        diary.setVerifiedAt(LocalDateTime.now());
        diary.setUpdatedAt(LocalDateTime.now());

        return diaryRepository.save(diary);
    }

    private String getRole(User user) {
        if (user.getRoles().contains("ROLE_FARM_MANAGER")) {
            return "FARM_MANAGER";
        }

        if (user.getRoles().contains("ROLE_STAFF")) {
            return "STAFF";
        }

        if (user.getRoles().contains("ROLE_ADMIN")) {
            return "ADMIN";
        }

        throw new IllegalArgumentException(
                "Tài khoản không có quyền sử dụng chức năng nhật ký");
    }

    private void validateRequest(DailyDiaryRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Dữ liệu nhật ký không được để trống");
        }

        if (request.getDate() == null) {
            throw new IllegalArgumentException(
                    "Ngày ghi nhật ký không được để trống");
        }

        if (request.getDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày ghi nhật ký không được ở tương lai");
        }

        if (!List.of("CA_SANG", "CA_CHIEU", "CA_DEM")
                .contains(request.getShift())) {
            throw new IllegalArgumentException(
                    "Ca làm việc không hợp lệ");
        }

        if (request.getWeather() == null
                || !List.of("Nang_Rao", "Mua_Am", "Gió_Lanh")
                        .contains(request.getWeather())) {
            throw new IllegalArgumentException(
                    "Thời tiết không hợp lệ");
        }

        if (request.getTempAvg() < -20
                || request.getTempAvg() > 60) {
            throw new IllegalArgumentException(
                    "Nhiệt độ trung bình không hợp lệ");
        }

        if (request.getPenActivities() == null
                || request.getPenActivities().isEmpty()) {
            throw new IllegalArgumentException(
                    "Danh sách hoạt động chuồng không được để trống");
        }

        for (DailyDiaryRequest.PenActivityRequest item
                : request.getPenActivities()) {

            if (item.getPenId() == null
                    || item.getPenId().isBlank()) {
                throw new IllegalArgumentException(
                        "Mã chuồng không được để trống");
            }

            if (item.getFeedEatenPercentage() < 0
                    || item.getFeedEatenPercentage() > 100) {
                throw new IllegalArgumentException(
                        "Tỷ lệ thức ăn đã ăn phải từ 0 đến 100");
            }
        }
    }
}
