
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.HealthRecordRequest;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.HealthRecord;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.HealthRecordRepository;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.HealthService;
import com.bovsmart.jwt.model.User;
import com.bovsmart.jwt.repository.UserRepository;
import com.bovsmart.jwt.dto.response.VeterinaryStaffOption;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;

@Service
public class HealthServiceImpl implements HealthService {

    private final HealthRecordRepository healthRecordRepository;
    private final CattleRepository cattleRepository;
    private final UserRepository userRepository;

    public HealthServiceImpl(
        HealthRecordRepository healthRecordRepository,
            CattleRepository cattleRepository,
            UserRepository userRepository) {

        this.healthRecordRepository = healthRecordRepository;
        this.cattleRepository = cattleRepository;
        this.userRepository = userRepository;
    }

    // Kiểm tra quyền
    private boolean hasRole(UserDetailsImpl user, String role) {
        return user != null && user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }

    // Kiểm tra nội dung
    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    // Chuẩn hóa tên bộ phận, bỏ dấu tiếng Việt
    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value.trim().toLowerCase(Locale.ROOT),
                Normalizer.Form.NFD
        );

        return normalized
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd');
    }

    // Kiểm tra định dạng ngày
    private LocalDate parseDate(String value, String errorMessage) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException(errorMessage);
        }
    }


    // 1. Lấy danh sách nhân viên Thú y
    @Override
    public List<VeterinaryStaffOption> getAvailableVeterinarians() {

        return userRepository.findAll().stream()
                .filter(User::isEnabled)
                .filter(user -> user.getRoles() != null
                        && user.getRoles().contains("ROLE_STAFF"))
                .filter(user -> "thu y".equals(
                        normalizeText(user.getDepartment())))
                .sorted((a, b) -> {
                    String nameA = hasText(a.getFullName())
                            ? a.getFullName() : a.getEmail();

                    String nameB = hasText(b.getFullName())
                            ? b.getFullName() : b.getEmail();

                    return nameA.compareToIgnoreCase(nameB);
                })
                .map(user -> new VeterinaryStaffOption(
                        user.getId(),
                        hasText(user.getFullName())
                                ? user.getFullName() : user.getEmail(),
                        user.getEmail(),
                        user.getDepartment()
                ))
                .toList();
    }

    // 2. Quản lý phân công nhân viên Thú y
    @Override
    public HealthRecord assignVeterinarian(
            String id,
            String vetId,
            UserDetailsImpl currentUser) {

        if (currentUser == null
                || !hasRole(currentUser, "ROLE_FARM_MANAGER")) {
            throw new IllegalArgumentException(
                    "Chỉ quản lý trang trại mới được phân công nhân viên Thú y!");
        }

        if (!hasText(vetId)) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn nhân viên Thú y!");
        }

        HealthRecord record = getHealthRecordById(id);

        if (!"PENDING_VET_REVIEW".equals(record.getRecordStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ hồ sơ đang chờ Thú y kiểm tra mới được phân công!");
        }

        User vet = userRepository.findById(vetId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy nhân viên Thú y!"));

        if (!vet.isEnabled()
                || vet.getRoles() == null
                || !vet.getRoles().contains("ROLE_STAFF")
                || !"thu y".equals(normalizeText(vet.getDepartment()))) {

            throw new IllegalArgumentException(
                    "Tài khoản được chọn không phải nhân viên Thú y đang hoạt động!");
        }

        record.setAssignedVetId(vet.getId());
        record.setAssignedVetEmail(vet.getEmail());
        record.setAssignedVetName(
                hasText(vet.getFullName())
                        ? vet.getFullName() : vet.getEmail()
        );
        record.setAssignedBy(currentUser.getEmail());
        record.setAssignedAt(LocalDateTime.now());

        return healthRecordRepository.save(record);
    }

    // 3. Nhân viên Thú y lấy danh sách hồ sơ được phân công
    @Override
    public List<HealthRecord> getAssignedHealthRecords(
            UserDetailsImpl currentUser) {

        if (currentUser == null
                || !hasRole(currentUser, "ROLE_STAFF")) {
            throw new IllegalArgumentException(
                    "Bạn không có quyền xem hồ sơ được phân công!");
        }

        if (!"thu y".equals(normalizeText(currentUser.getDepartment()))) {
            throw new IllegalArgumentException(
                    "Chỉ nhân viên Thú y mới được sử dụng chức năng này!");
        }

        return healthRecordRepository
                .findByAssignedVetIdOrderByCreatedAtDesc(
                        currentUser.getId()
                );
    }


    // 1. Tạo hồ sơ sức khỏe
    @Override
    public HealthRecord createHealthRecord(
            HealthRecordRequest request,
            UserDetailsImpl currentUser) {

        if (currentUser == null) {
            throw new IllegalArgumentException(
                    "Không xác định được tài khoản đăng nhập!");
        }

        boolean isFarmManager = hasRole(
                currentUser, "ROLE_FARM_MANAGER");

        boolean isStaff = hasRole(
                currentUser, "ROLE_STAFF");

        boolean isCareStaff = false;
        boolean isVeterinary = false;

        if (isStaff) {
            String department = normalizeText(
                    currentUser.getDepartment());

            isVeterinary = "thu y".equals(department);
            isCareStaff = "cham soc bo".equals(department);

            if (!isVeterinary && !isCareStaff) {
                throw new IllegalArgumentException(
                        "Bộ phận của tài khoản chưa được cấp quyền ghi hồ sơ sức khỏe!");
            }
        }

        if (!isStaff && !isFarmManager) {
            throw new IllegalArgumentException(
                    "Bạn không có quyền ghi hồ sơ sức khỏe!");
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Thông tin hồ sơ không được để trống!");
        }

        // Nhân viên chăm sóc chỉ được ghi nhận quan sát
        if (isCareStaff) {
            boolean hasTreatmentInfo =
                    hasText(request.getTreatment())
                    || hasText(request.getMedicine())
                    || hasText(request.getDosage())
                    || hasText(request.getTreatmentStartDate())
                    || hasText(request.getTreatmentEndDate())
                    || request.getWithdrawalPeriodDays() != null
                    || hasText(request.getDiagnosis());

            if (hasTreatmentInfo) {
                throw new IllegalArgumentException(
                        "Nhân viên chăm sóc bò chỉ được ghi nhận quan sát. "
                        + "Thông tin chẩn đoán và điều trị phải do thú y cập nhật!");
            }
        }

        if (!hasText(request.getCattleId())) {
            throw new IllegalArgumentException("ID bò không được để trống!");
        }

        Cattle cattle = cattleRepository.findById(request.getCattleId())
                .orElseThrow(() ->
                        new IllegalArgumentException("Không tìm thấy bò!"));

        if (!hasText(request.getExaminationDate())) {
            throw new IllegalArgumentException(
                    "Ngày khám không được để trống!");
        }

        parseDate(
                request.getExaminationDate(),
                "Ngày khám không đúng định dạng yyyy-MM-dd!"
        );

        if (!hasText(request.getSymptoms())) {
            throw new IllegalArgumentException(
                    "Thông tin triệu chứng hoặc dấu hiệu quan sát không được để trống!");
        }

        if (!isCareStaff && !hasText(request.getDiagnosis())) {
            throw new IllegalArgumentException(
                    "Kết quả khám không được để trống!");
        }

        Integer withdrawalDays = request.getWithdrawalPeriodDays();
            String withdrawalEndDate = null;

            if (hasText(request.getMedicine()) && withdrawalDays == null) {
                throw new IllegalArgumentException(
                        "Có sử dụng thuốc, phải nhập số ngày ngừng thuốc!");
            }

            if (withdrawalDays != null) {
                if (withdrawalDays < 0) {
                    throw new IllegalArgumentException(
                            "Số ngày ngừng thuốc không được nhỏ hơn 0!");
                }

                // Chỉ tính ngày kết thúc nếu thực sự có thời gian ngừng thuốc
                if (withdrawalDays > 0) {
                    if (!hasText(request.getTreatmentEndDate())) {
                        throw new IllegalArgumentException(
                                "Phải nhập ngày kết thúc điều trị khi có thời gian ngừng thuốc!");
                    }

                    LocalDate treatmentEnd = parseDate(
                            request.getTreatmentEndDate(),
                            "Ngày kết thúc điều trị không đúng định dạng yyyy-MM-dd!"
                    );

                    withdrawalEndDate = treatmentEnd
                            .plusDays(withdrawalDays)
                            .toString();
                }
            }

        HealthRecord record = new HealthRecord();

        record.setCattleId(cattle.getId());
        record.setRfidTag(cattle.getRfidTag());
        record.setEarTagNumber(cattle.getEarTagNumber());

        record.setExaminationDate(request.getExaminationDate());
        record.setSymptoms(request.getSymptoms());

        record.setDiagnosis(
                isCareStaff
                        ? "Chưa có kết luận chuyên môn."
                        : request.getDiagnosis()
        );

        record.setTreatment(request.getTreatment());
        record.setMedicine(request.getMedicine());
        record.setDosage(request.getDosage());

        record.setTreatmentStartDate(request.getTreatmentStartDate());
        record.setTreatmentEndDate(request.getTreatmentEndDate());
        record.setFollowUpDate(request.getFollowUpDate());

        record.setWithdrawalPeriodDays(withdrawalDays);
        record.setWithdrawalEndDate(withdrawalEndDate);

        record.setWithdrawalStatus("NOT_CONFIRMED");

        // Trạng thái ban đầu
        if (isCareStaff) {
            record.setRecordStatus("PENDING_VET_REVIEW");
        } else {
            record.setRecordStatus("WAITING_MANAGER_CONFIRMATION");
        }

        record.setNotes(request.getNotes());
        record.setRecordedBy(currentUser.getEmail());
        record.setCreatedAt(LocalDateTime.now());

        return healthRecordRepository.save(record);
    }

    // 2. Thú y cập nhật hồ sơ đã được nhân viên chăm sóc ghi nhận
    @Override
    public HealthRecord updateHealthRecord(
            String id,
            HealthRecordRequest request,
            UserDetailsImpl currentUser) {

        if (currentUser == null || !hasRole(currentUser, "ROLE_STAFF")) {
            throw new IllegalArgumentException(
                    "Bạn không có quyền cập nhật hồ sơ!");
        }

        String department = normalizeText(currentUser.getDepartment());

        if (!"thu y".equals(department)) {
            throw new IllegalArgumentException(
                    "Chỉ nhân viên thuộc bộ phận Thú y mới được cập nhật chẩn đoán và điều trị!");
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "Thông tin cập nhật không được để trống!");
        }

        HealthRecord record = getHealthRecordById(id);

    // Kiểm tra hồ sơ đã được quản lý phân công cho đúng thú y
    if (!currentUser.getId().equals(record.getAssignedVetId())) {
        throw new IllegalArgumentException(
                "Hồ sơ này chưa được quản lý phân công cho bạn!");
    }

    if (!"PENDING_VET_REVIEW".equals(record.getRecordStatus())) {
            throw new IllegalArgumentException(
                    "Hồ sơ này không còn ở trạng thái chờ thú y kiểm tra!");
        }

        if (!hasText(request.getDiagnosis())) {
            throw new IllegalArgumentException(
                    "Thú y phải nhập kết luận chuyên môn!");
        }

        if (!hasText(request.getSymptoms())) {
            throw new IllegalArgumentException(
                    "Thông tin triệu chứng không được để trống!");
        }

        if (!hasText(request.getExaminationDate())) {
            throw new IllegalArgumentException(
                    "Ngày khám không được để trống!");
        }

        parseDate(
                request.getExaminationDate(),
                "Ngày khám không đúng định dạng yyyy-MM-dd!"
        );

        Integer withdrawalDays = request.getWithdrawalPeriodDays();
            String withdrawalEndDate = null;

            if (hasText(request.getMedicine()) && withdrawalDays == null) {
                throw new IllegalArgumentException(
                        "Có sử dụng thuốc, phải nhập số ngày ngừng thuốc!");
            }

            if (withdrawalDays != null) {
                if (withdrawalDays < 0) {
                    throw new IllegalArgumentException(
                            "Số ngày ngừng thuốc không được nhỏ hơn 0!");
                }

                if (withdrawalDays > 0) {
                    if (!hasText(request.getTreatmentEndDate())) {
                        throw new IllegalArgumentException(
                                "Phải nhập ngày kết thúc điều trị!");
                    }

                    LocalDate treatmentEnd = parseDate(
                            request.getTreatmentEndDate(),
                            "Ngày kết thúc điều trị không đúng định dạng yyyy-MM-dd!"
                    );

                    withdrawalEndDate = treatmentEnd
                            .plusDays(withdrawalDays)
                            .toString();
                }
            }

        if (hasText(request.getTreatmentStartDate())
                && hasText(request.getTreatmentEndDate())) {

            LocalDate start = parseDate(
                    request.getTreatmentStartDate(),
                    "Ngày bắt đầu điều trị không hợp lệ!"
            );

            LocalDate end = parseDate(
                    request.getTreatmentEndDate(),
                    "Ngày kết thúc điều trị không hợp lệ!"
            );

            if (end.isBefore(start)) {
                throw new IllegalArgumentException(
                        "Ngày kết thúc điều trị không được trước ngày bắt đầu!");
            }
        }

        if (hasText(request.getFollowUpDate())) {
            parseDate(
                    request.getFollowUpDate(),
                    "Ngày tái khám không đúng định dạng yyyy-MM-dd!"
            );
        }

        // Cập nhật hồ sơ cũ, không tạo hồ sơ mới
        record.setExaminationDate(request.getExaminationDate());
        record.setSymptoms(request.getSymptoms());
        record.setDiagnosis(request.getDiagnosis());
        record.setTreatment(request.getTreatment());
        record.setMedicine(request.getMedicine());
        record.setDosage(request.getDosage());

        record.setTreatmentStartDate(request.getTreatmentStartDate());
        record.setTreatmentEndDate(request.getTreatmentEndDate());
        record.setFollowUpDate(request.getFollowUpDate());

        record.setWithdrawalPeriodDays(withdrawalDays);
        record.setWithdrawalEndDate(withdrawalEndDate);

        record.setWithdrawalStatus("NOT_CONFIRMED");
        record.setRecordStatus("WAITING_MANAGER_CONFIRMATION");

        record.setVetReviewedBy(currentUser.getEmail());
        record.setVetReviewedAt(LocalDateTime.now());

        if (request.getNotes() != null) {
            record.setNotes(request.getNotes());
        }

        return healthRecordRepository.save(record);
    }

    // 3. Lấy toàn bộ hồ sơ
    @Override
    public List<HealthRecord> getAllHealthRecords() {
        return healthRecordRepository.findAll();
    }

    // 4. Lấy hồ sơ theo bò
    @Override
    public List<HealthRecord> getHealthRecordsByCattleId(String cattleId) {

        if (!cattleRepository.existsById(cattleId)) {
            throw new IllegalArgumentException("Không tìm thấy bò!");
        }

        return healthRecordRepository
                .findByCattleIdOrderByCreatedAtDesc(cattleId);
    }

    // 5. Lấy chi tiết hồ sơ
    @Override
    public HealthRecord getHealthRecordById(String id) {
        return healthRecordRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Không tìm thấy hồ sơ khám!"));
    }

    // 6. FARM_MANAGER xác nhận tình trạng ngừng thuốc
    @Override
    public HealthRecord confirmWithdrawalStatus(
            String id,
            String withdrawalStatus,
            String confirmedBy
    ) {
        HealthRecord record = healthRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ sức khỏe!"));

        boolean isInitialConfirmation =
                "WAITING_MANAGER_CONFIRMATION".equals(record.getRecordStatus());

        boolean isWithdrawalCompletion =
                "IN_TREATMENT".equals(record.getRecordStatus())
                && "WAITING".equals(record.getWithdrawalStatus());

        // Chỉ chấp nhận xác nhận lần đầu hoặc xác nhận hoàn tất ngừng thuốc.
        if (!isInitialConfirmation && !isWithdrawalCompletion) {
            throw new RuntimeException("Hồ sơ không ở trạng thái cần xác nhận!");
        }

        if ("NO_WITHDRAWAL_REQUIRED".equals(withdrawalStatus)) {

            if (!isInitialConfirmation) {
                throw new RuntimeException("Không thể thay đổi trạng thái ngừng thuốc ở bước này!");
            }

            if (record.getWithdrawalPeriodDays() != null
                    && record.getWithdrawalPeriodDays() > 0) {
                throw new RuntimeException(
                        "Hồ sơ có thời gian ngừng thuốc, không thể xác nhận không cần ngừng thuốc!"
                );
            }

            record.setWithdrawalPeriodDays(0);
            record.setWithdrawalEndDate(null);
            record.setWithdrawalStatus("NO_WITHDRAWAL_REQUIRED");
            record.setRecordStatus("COMPLETED");

        } else if ("WAITING".equals(withdrawalStatus)) {

            if (!isInitialConfirmation) {
                throw new RuntimeException("Hồ sơ không ở bước xác nhận ngừng thuốc ban đầu!");
            }

            if (record.getWithdrawalPeriodDays() == null
                    || record.getWithdrawalPeriodDays() <= 0
                    || record.getWithdrawalEndDate() == null
                    || record.getWithdrawalEndDate().isBlank()) {
                throw new RuntimeException("Thông tin thời gian ngừng thuốc không hợp lệ!");
            }

            LocalDate endDate = LocalDate.parse(record.getWithdrawalEndDate());

            if (LocalDate.now().isBefore(endDate)) {
                record.setWithdrawalStatus("WAITING");
                record.setRecordStatus("IN_TREATMENT");
            } else {
                record.setWithdrawalStatus("COMPLETED");
                record.setRecordStatus("COMPLETED");
            }

        } else if ("COMPLETED".equals(withdrawalStatus)) {

            if (!isWithdrawalCompletion) {
                throw new RuntimeException(
                        "Hồ sơ chưa được xác nhận đang trong thời gian ngừng thuốc!"
                );
            }

            if (record.getWithdrawalEndDate() == null
                    || record.getWithdrawalEndDate().isBlank()) {
                throw new RuntimeException("Không tìm thấy ngày kết thúc ngừng thuốc!");
            }

            LocalDate endDate = LocalDate.parse(record.getWithdrawalEndDate());

            if (LocalDate.now().isBefore(endDate)) {
                throw new RuntimeException("Chưa hết thời gian ngừng thuốc!");
            }

            record.setWithdrawalStatus("COMPLETED");
            record.setRecordStatus("COMPLETED");

        } else {
            throw new RuntimeException("Trạng thái xác nhận không hợp lệ!");
        }

        record.setManagerConfirmedBy(confirmedBy);
        record.setManagerConfirmedAt(LocalDateTime.now());

        return healthRecordRepository.save(record);
    }
    }
