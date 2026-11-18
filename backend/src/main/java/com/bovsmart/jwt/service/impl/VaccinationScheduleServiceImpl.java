
package com.bovsmart.jwt.service.impl;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.bovsmart.jwt.dto.request.VaccinationScheduleRequest;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.model.VaccinationSchedule;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.UserRepository;
import com.bovsmart.jwt.repository.VaccinationScheduleRepository;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.VaccinationScheduleService;
import com.bovsmart.jwt.model.VaccinationRecord;
import com.bovsmart.jwt.repository.VaccinationRecordRepository;

@Service
public class VaccinationScheduleServiceImpl
        implements VaccinationScheduleService {

    private final VaccinationScheduleRepository scheduleRepository;
    private final CattleRepository cattleRepository;
    private final UserRepository userRepository;
    private final VaccinationRecordRepository vaccinationRecordRepository;
 
    public VaccinationScheduleServiceImpl(
            VaccinationScheduleRepository scheduleRepository,
            CattleRepository cattleRepository,
            UserRepository userRepository,
            VaccinationRecordRepository vaccinationRecordRepository) {

        this.scheduleRepository = scheduleRepository;
        this.cattleRepository = cattleRepository;
        this.userRepository = userRepository;
        this.vaccinationRecordRepository = vaccinationRecordRepository;
    }

    @Override
    public VaccinationSchedule createSchedule(
            VaccinationScheduleRequest request,
            UserDetailsImpl currentUser) {

        if (currentUser == null || !hasRole(currentUser, "FARM_MANAGER")) {
            throw new RuntimeException(
                    "Chỉ Quản lý trang trại được tạo lịch tiêm");
        }

        if (request == null) {
            throw new RuntimeException("Thông tin lịch tiêm không hợp lệ");
        }

        if (!hasText(request.getVaccineName())) {
            throw new RuntimeException("Tên vaccine không được để trống");
        }

        if (!hasText(request.getScheduledDate())) {
            throw new RuntimeException("Ngày tiêm dự kiến không được để trống");
        }

        LocalDate scheduledDate;
        try {
            scheduledDate = LocalDate.parse(request.getScheduledDate());
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Ngày tiêm phải có định dạng yyyy-MM-dd");
        }

        if (scheduledDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Ngày tiêm dự kiến không được ở quá khứ");
        }

        if (request.getCattleIds() == null
                || request.getCattleIds().isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ít nhất một con bò");
        }

        if (!hasText(request.getAssignedVeterinarianEmail())) {
            throw new RuntimeException("Vui lòng chọn nhân viên Thú y");
        }

        String veterinarianEmail =
                request.getAssignedVeterinarianEmail().trim();

        User veterinarian = userRepository.findByEmail(veterinarianEmail)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy nhân viên Thú y"));

        if (!veterinarian.isEnabled()) {
            throw new RuntimeException("Tài khoản nhân viên đã bị vô hiệu hóa");
        }

        boolean isStaff = veterinarian.getRoles() != null
            && veterinarian.getRoles().stream()
                    .map(this::normalizeText)
                    .anyMatch(role ->
                            role.equals("role_staff")
                            || role.equals("staff"));

        boolean isVeterinary = normalizeText(
                veterinarian.getDepartment()).equals("thu y");

        if (!isStaff || !isVeterinary) {
            throw new RuntimeException(
                    "Chỉ được giao lịch cho STAFF thuộc bộ phận Thú y");
        }

        List<String> cattleIds = request.getCattleIds().stream()
                .filter(id -> id != null && !id.isBlank())
                .map(String::trim)
                .distinct()
                .toList();

        if (cattleIds.isEmpty()) {
            throw new RuntimeException("Danh sách bò không hợp lệ");
        }

        for (String cattleId : cattleIds) {
            if (!cattleRepository.existsById(cattleId)) {
                throw new RuntimeException(
                        "Không tìm thấy bò có ID: " + cattleId);
            }
        }

        VaccinationSchedule schedule = new VaccinationSchedule();

        schedule.setTargetGroup(request.getTargetGroup());
        schedule.setCattleIds(cattleIds);
        schedule.setVaccineName(request.getVaccineName().trim());
        schedule.setVaccineType(request.getVaccineType());
        schedule.setDosage(request.getDosage());
        schedule.setScheduledDate(scheduledDate.toString());

        schedule.setAssignedVeterinarianEmail(veterinarian.getEmail());
        schedule.setAssignedVeterinarianName(
                hasText(veterinarian.getFullName())
                        ? veterinarian.getFullName()
                        : veterinarian.getUsername());

        schedule.setStatus("SCHEDULED");
        schedule.setNotes(request.getNotes());
        schedule.setCreatedBy(currentUser.getEmail());
        schedule.setCreatedAt(LocalDateTime.now());

        return scheduleRepository.save(schedule);
    }

    @Override
    public List<VaccinationSchedule> getAllSchedules() {
        return scheduleRepository.findAllByOrderByScheduledDateAsc();
    }

    @Override
    public List<VaccinationSchedule> getSchedulesAssignedToVeterinarian(
            UserDetailsImpl currentUser) {

        if (currentUser == null || !hasRole(currentUser, "STAFF")) {
            throw new RuntimeException("Bạn không có quyền xem lịch tiêm được giao");
        }

        String department = normalizeText(currentUser.getDepartment());

        if (!department.equals("thu y")) {
            throw new RuntimeException(
                    "Chỉ nhân viên thuộc bộ phận Thú y được xem lịch tiêm");
        }

        return scheduleRepository
                .findByAssignedVeterinarianEmailOrderByScheduledDateAsc(
                        currentUser.getEmail());
    }

    @Override
    public VaccinationSchedule getScheduleById(String id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy lịch tiêm"));
    }

    @Override
    public VaccinationSchedule updateScheduleStatus(
            String id,
            String status,
            UserDetailsImpl currentUser) {

        if (currentUser == null || !hasRole(currentUser, "FARM_MANAGER")) {
            throw new RuntimeException(
                    "Chỉ Quản lý trang trại được cập nhật trạng thái lịch");
        }

        if (status == null) {
            throw new RuntimeException("Trạng thái lịch tiêm không hợp lệ");
        }

        status = status.trim().toUpperCase(Locale.ROOT);

        if (!List.of("SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED")
                .contains(status)) {
            throw new RuntimeException("Trạng thái lịch tiêm không hợp lệ");
        }

        VaccinationSchedule schedule = getScheduleById(id);

        // Chỉ hoàn thành khi tất cả bò đã có bản ghi tiêm hợp lệ
        if ("COMPLETED".equals(status)) {

            if (schedule.getCattleIds() == null
                    || schedule.getCattleIds().isEmpty()) {
                throw new RuntimeException("Lịch tiêm chưa có danh sách bò");
            }

            LocalDate scheduledDate = LocalDate.parse(
                    schedule.getScheduledDate());

            int pendingCount = 0;

            for (String cattleId : schedule.getCattleIds()) {

                List<VaccinationRecord> records =
                        vaccinationRecordRepository
                                .findByCattleIdOrderByCreatedAtDesc(cattleId);

                boolean recorded = records.stream().anyMatch(record -> {

                    if (record.getVaccineName() == null
                            || record.getVaccinationDate() == null) {
                        return false;
                    }

                    boolean sameVaccine = normalizeText(
                            record.getVaccineName()).equals(
                                    normalizeText(schedule.getVaccineName()));

                    if (!sameVaccine) {
                        return false;
                    }

                    try {
                        LocalDate actualDate = LocalDate.parse(
                                record.getVaccinationDate());

                        return !actualDate.isBefore(scheduledDate);

                    } catch (DateTimeParseException e) {
                        return false;
                    }
                });

                if (!recorded) {
                    pendingCount++;
                }
            }

            if (pendingCount > 0) {
                throw new RuntimeException(
                        "Còn " + pendingCount
                                + " con bò chưa có bản ghi tiêm hợp lệ. "
                                + "Chưa thể hoàn thành lịch tiêm!");
            }
        }

        schedule.setStatus(status);

        if ("COMPLETED".equals(status)) {
            schedule.setCompletedAt(LocalDateTime.now());
        } else {
            schedule.setCompletedAt(null);
        }

        return scheduleRepository.save(schedule);
    }

    private boolean hasRole(UserDetailsImpl user, String expectedRole) {
        return user.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority()
                        .equals("ROLE_" + expectedRole));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value.trim().toLowerCase(Locale.ROOT),
                Normalizer.Form.NFD);

        return normalized.replaceAll("\\p{M}", "").replace('đ', 'd');
    }
}
