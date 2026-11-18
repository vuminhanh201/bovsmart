
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.model.VaccinationRecord;
import com.bovsmart.jwt.repository.VaccinationRecordRepository;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.dto.request.VaccinationRecordRequest;
import com.bovsmart.jwt.service.VaccinationService;
import com.bovsmart.jwt.service.BlockchainService;
import com.bovsmart.jwt.service.AuditLogService;
import com.bovsmart.jwt.security.services.UserDetailsImpl;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.text.Normalizer;
import java.util.Locale;

@Service
public class VaccinationServiceImpl implements VaccinationService {

    private final VaccinationRecordRepository vaccinationRecordRepository;
    private final CattleRepository cattleRepository;
    private final BlockchainService blockchainService;
    private final AuditLogService auditLogService;

    public VaccinationServiceImpl(
            VaccinationRecordRepository vaccinationRecordRepository,
            CattleRepository cattleRepository,
            BlockchainService blockchainService,
            AuditLogService auditLogService) {

        this.vaccinationRecordRepository = vaccinationRecordRepository;
        this.cattleRepository = cattleRepository;
        this.blockchainService = blockchainService;
        this.auditLogService = auditLogService;
    }

    @Override
    public VaccinationRecord createVaccinationRecord(
            VaccinationRecordRequest request,
            UserDetailsImpl currentUser) {

        if (currentUser == null) {
            throw new RuntimeException("Không xác định được người dùng đăng nhập");
        }

        boolean isManager = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FARM_MANAGER"));

        boolean isStaff = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));

        if (!isManager && !isStaff) {
            throw new RuntimeException("Bạn không có quyền ghi nhận tiêm phòng");
        }

        if (isStaff) {
            String department = normalizeText(currentUser.getDepartment());

            if (!department.equals("thu y")) {
                throw new RuntimeException(
                        "Chỉ nhân viên thuộc bộ phận Thú y được ghi nhận tiêm phòng");
            }
        }

        String administeredBy = currentUser.getEmail();
        String role = isManager ? "FARM_MANAGER" : "STAFF";

        if (request == null) {
            throw new RuntimeException("Thông tin tiêm phòng không hợp lệ");
        }

        if (request.getCattleId() == null || request.getCattleId().isBlank()) {
            throw new RuntimeException("Mã bò không được để trống");
        }

        if (request.getVaccineName() == null || request.getVaccineName().isBlank()) {
            throw new RuntimeException("Tên vaccine không được để trống");
        }

        if (request.getDosage() == null || request.getDosage().isBlank()) {
            throw new RuntimeException("Liều lượng không được để trống");
        }

        if (request.getVaccinationDate() == null
                || request.getVaccinationDate().isBlank()) {
            throw new RuntimeException("Ngày tiêm không được để trống");
        }

        var cattle = cattleRepository.findById(request.getCattleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bò"));

        VaccinationRecord record = new VaccinationRecord();

        record.setCattleId(cattle.getId());
        record.setRfidTag(cattle.getRfidTag());
        record.setEarTagNumber(cattle.getEarTagNumber());
        record.setVaccineName(request.getVaccineName());
        record.setVaccineType(request.getVaccineType());
        record.setDosage(request.getDosage());
        record.setVaccinationDate(request.getVaccinationDate());
        record.setNextVaccinationDate(request.getNextVaccinationDate());
        record.setBatchNumber(request.getBatchNumber());
        record.setManufacturer(request.getManufacturer());
        record.setNotes(request.getNotes());
        record.setAdministeredBy(administeredBy);
        record.setCreatedAt(java.time.LocalDateTime.now());

        VaccinationRecord savedRecord = vaccinationRecordRepository.save(record);

        Map<String, Object> blockData = new HashMap<>();
        blockData.put("vaccinationRecordId", savedRecord.getId());
        blockData.put("cattleId", savedRecord.getCattleId());
        blockData.put("rfidTag", savedRecord.getRfidTag());
        blockData.put("earTagNumber", savedRecord.getEarTagNumber());
        blockData.put("vaccineName", savedRecord.getVaccineName());
        blockData.put("vaccineType", savedRecord.getVaccineType());
        blockData.put("dosage", savedRecord.getDosage());
        blockData.put("vaccinationDate", savedRecord.getVaccinationDate());
        blockData.put("nextVaccinationDate", savedRecord.getNextVaccinationDate());
        blockData.put("batchNumber", savedRecord.getBatchNumber());
        blockData.put("administeredBy", administeredBy);

        blockchainService.createBlock(
                "CATTLE_VACCINATION_RECORDED",
                blockData,
                administeredBy,
                role
        );

        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("vaccinationRecordId", savedRecord.getId());
        auditDetails.put("cattleId", savedRecord.getCattleId());
        auditDetails.put("rfidTag", savedRecord.getRfidTag());
        auditDetails.put("earTagNumber", savedRecord.getEarTagNumber());
        auditDetails.put("vaccineName", savedRecord.getVaccineName());
        auditDetails.put("dosage", savedRecord.getDosage());
        auditDetails.put("vaccinationDate", savedRecord.getVaccinationDate());
        auditDetails.put("batchNumber", savedRecord.getBatchNumber());

        auditLogService.createLog(
                administeredBy,
                role,
                "CATTLE_VACCINATION_RECORDED",
                "VACCINATION",
                savedRecord.getId(),
                "Ghi nhận tiêm phòng cho bò",
                auditDetails
        );

        return savedRecord;
    }

    @Override
    public List<VaccinationRecord> getAllVaccinationRecords() {
        return vaccinationRecordRepository.findAll();
    }

    @Override
    public List<VaccinationRecord> getVaccinationRecordsByCattleId(String cattleId) {
        if (!cattleRepository.existsById(cattleId)) {
            throw new RuntimeException("Không tìm thấy bò");
        }

        return vaccinationRecordRepository
                .findByCattleIdOrderByCreatedAtDesc(cattleId);
    }

    @Override
    public VaccinationRecord getVaccinationRecordById(String id) {
        return vaccinationRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch tiêm"));
    }

    // Lấy các lịch tiêm có ngày hợp lệ
    private List<VaccinationRecord> getValidDatedVaccinations() {
        return vaccinationRecordRepository.findByNextVaccinationDateIsNotNull()
                .stream()
                .filter(record -> record.getNextVaccinationDate() != null
                        && !record.getNextVaccinationDate().isBlank())
                .filter(record -> {
                    try {
                        LocalDate.parse(record.getNextVaccinationDate());
                        return true;
                    } catch (DateTimeParseException e) {
                        return false;
                    }
                })
                .toList();
    }

    // Lịch tiêm sắp đến hạn trong 7 ngày, tính cả hôm nay
    @Override
    public List<VaccinationRecord> getUpcomingVaccinations() {
        LocalDate today = LocalDate.now();
        LocalDate limitDate = today.plusDays(7);

        return getValidDatedVaccinations().stream()
                .filter(record -> {
                    LocalDate nextDate =
                            LocalDate.parse(record.getNextVaccinationDate());

                    return !nextDate.isBefore(today)
                            && !nextDate.isAfter(limitDate);
                })
                .sorted(Comparator.comparing(
                        record -> LocalDate.parse(record.getNextVaccinationDate())))
                .toList();
    }

    // Lịch tiêm đã quá hạn
    @Override
    public List<VaccinationRecord> getOverdueVaccinations() {
        LocalDate today = LocalDate.now();

        return getValidDatedVaccinations().stream()
                .filter(record -> LocalDate.parse(
                        record.getNextVaccinationDate()).isBefore(today))
                .sorted(Comparator.comparing(
                        record -> LocalDate.parse(record.getNextVaccinationDate())))
                .toList();
    }

    // Tất cả lịch tiêm cần theo dõi
    @Override
    public List<VaccinationRecord> getVaccinationsNeedingAttention() {
        LocalDate limitDate = LocalDate.now().plusDays(7);

        return getValidDatedVaccinations().stream()
                .filter(record -> !LocalDate.parse(
                        record.getNextVaccinationDate()).isAfter(limitDate))
                .sorted(Comparator.comparing(
                        record -> LocalDate.parse(record.getNextVaccinationDate())))
                .toList();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(
                value.trim().toLowerCase(Locale.ROOT),
                Normalizer.Form.NFD
        );

        return normalized.replaceAll("\\p{M}", "").replace('đ', 'd');
    }
}
