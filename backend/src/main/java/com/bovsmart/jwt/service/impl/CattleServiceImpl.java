package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.WeightRecordRequest;
import com.bovsmart.jwt.dto.response.SaleEligibilityResponse;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.HealthRecord;
import com.bovsmart.jwt.model.WeightRecord;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.HealthRecordRepository;
import com.bovsmart.jwt.service.CattleService;
import com.bovsmart.jwt.service.BlockchainService;
import com.bovsmart.jwt.service.AuditLogService;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
@Service
public class CattleServiceImpl implements CattleService {

    private final CattleRepository cattleRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final BlockchainService blockchainService;
    private final AuditLogService auditLogService;

    public CattleServiceImpl(
            CattleRepository cattleRepository,
            HealthRecordRepository healthRecordRepository,
            BlockchainService blockchainService,
            AuditLogService auditLogService) {

        this.cattleRepository = cattleRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.blockchainService = blockchainService;
        this.auditLogService = auditLogService;
    }

    // Kiểm tra trùng RFID và số thẻ tai
    private void validateCattle(Cattle cattle, String currentId) {

        if (cattle.getRfidTag() == null || cattle.getRfidTag().isBlank()) {
            throw new IllegalArgumentException("Mã RFID không được để trống!");
        }

        if (cattle.getEarTagNumber() == null || cattle.getEarTagNumber().isBlank()) {
            throw new IllegalArgumentException("Số thẻ tai không được để trống!");
        }

        Optional<Cattle> existingRfid =
                cattleRepository.findByRfidTag(cattle.getRfidTag());

        if (existingRfid.isPresent()
                && !existingRfid.get().getId().equals(currentId)) {
            throw new IllegalArgumentException("Mã RFID đã tồn tại!");
        }

        Optional<Cattle> existingEarTag =
                cattleRepository.findByEarTagNumber(cattle.getEarTagNumber());

        if (existingEarTag.isPresent()
                && !existingEarTag.get().getId().equals(currentId)) {
            throw new IllegalArgumentException("Số thẻ tai đã tồn tại!");
        }
    }

    
    @Override
    public Cattle createCattle(
            Cattle cattle,
            String createdBy,
            String role) {

        validateCattle(cattle, null);

        Cattle savedCattle = cattleRepository.save(cattle);

        // Ghi nhận sự kiện tạo hồ sơ bò lên Blockchain
        Map<String, Object> blockData = new HashMap<>();
        blockData.put("cattleId", savedCattle.getId());
        blockData.put("rfidTag", savedCattle.getRfidTag());
        blockData.put("earTagNumber", savedCattle.getEarTagNumber());
        blockData.put("cattleName", savedCattle.getName());
        blockData.put("breed", savedCattle.getBreed());
        blockData.put("gender", savedCattle.getGender());
        blockData.put("initialWeight", savedCattle.getWeight());
        blockData.put("status", savedCattle.getStatus());

        blockchainService.createBlock(
                "CATTLE_CREATED",
                blockData,
                createdBy,
                role
        );

        // Ghi nhật ký Audit Log
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("cattleId", savedCattle.getId());
        auditDetails.put("rfidTag", savedCattle.getRfidTag());
        auditDetails.put("earTagNumber", savedCattle.getEarTagNumber());
        auditDetails.put("cattleName", savedCattle.getName());
        auditDetails.put("breed", savedCattle.getBreed());
        auditDetails.put("gender", savedCattle.getGender());
        auditDetails.put("weight", savedCattle.getWeight());
        auditDetails.put("status", savedCattle.getStatus());

        auditLogService.createLog(
                createdBy,
                role,
                "CATTLE_CREATED",
                "CATTLE",
                savedCattle.getId(),
                "Thêm hồ sơ bò mới",
                auditDetails
        );

        return savedCattle;
    }

    @Override
    public List<Cattle> getAllCattle() {
        return cattleRepository.findAll();
    }

    @Override
    public Optional<Cattle> getCattleById(String id) {
        return cattleRepository.findById(id);
    }

    @Override
    public Optional<Cattle> getCattleByRfidTag(String rfidTag) {

        if (rfidTag == null || rfidTag.isBlank()) {
            throw new IllegalArgumentException("Mã RFID không được để trống!");
        }

        return cattleRepository.findByRfidTag(rfidTag.trim());
    }

    @Override
    public Cattle updateCattle(
            String id,
            Cattle cattle,
            String updatedBy,
            String role) {

        Cattle existingCattle = cattleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy bò có ID: " + id));

        validateCattle(cattle, id);

        // Giữ lại lịch sử cân cũ
        cattle.setWeightHistory(
                existingCattle.getWeightHistory() == null
                        ? new ArrayList<>()
                        : new ArrayList<>(existingCattle.getWeightHistory())
        );

        cattle.setId(existingCattle.getId());

        // Lưu thông tin bò sau cập nhật
        Cattle savedCattle = cattleRepository.save(cattle);

        // Ghi nhận sự kiện cập nhật lên Blockchain
        Map<String, Object> blockData = new HashMap<>();
        blockData.put("cattleId", savedCattle.getId());
        blockData.put("rfidTag", savedCattle.getRfidTag());
        blockData.put("earTagNumber", savedCattle.getEarTagNumber());
        blockData.put("cattleName", savedCattle.getName());
        blockData.put("breed", savedCattle.getBreed());
        blockData.put("gender", savedCattle.getGender());
        blockData.put("weight", savedCattle.getWeight());
        blockData.put("status", savedCattle.getStatus());
        blockData.put("updatedBy", updatedBy);

        blockchainService.createBlock(
                "CATTLE_UPDATED",
                blockData,
                updatedBy,
                role
        );

        // Ghi nhật ký Audit Log
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("cattleId", savedCattle.getId());
        auditDetails.put("rfidTag", savedCattle.getRfidTag());
        auditDetails.put("earTagNumber", savedCattle.getEarTagNumber());
        auditDetails.put("cattleName", savedCattle.getName());
        auditDetails.put("breed", savedCattle.getBreed());
        auditDetails.put("weight", savedCattle.getWeight());
        auditDetails.put("status", savedCattle.getStatus());

        auditLogService.createLog(
                updatedBy,
                role,
                "CATTLE_UPDATED",
                "CATTLE",
                savedCattle.getId(),
                "Cập nhật thông tin bò",
                auditDetails
        );

        return savedCattle;
    }

    // Ghi nhận lần cân mới, không ghi đè lịch sử cũ
   @Override
    public Cattle recordWeight(
        String id,
        WeightRecordRequest request,
        String recordedBy,
        String role) {

        Cattle cattle = cattleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy bò có ID: " + id));

        if (request.getWeight() <= 0) {
            throw new IllegalArgumentException("Cân nặng phải lớn hơn 0!");
        }

        if (cattle.getWeightHistory() == null) {
            cattle.setWeightHistory(new ArrayList<>());
        }

        WeightRecord record = new WeightRecord();
        record.setId(UUID.randomUUID().toString());
        record.setDate(LocalDateTime.now().toString());
        record.setWeight(request.getWeight());
        record.setRecordedBy(recordedBy);
        record.setNote(request.getNote());
        record.setMethod(request.getMethod());
        record.setSource(request.getSource());

        cattle.getWeightHistory().add(record);
        cattle.setWeight(request.getWeight());

        Cattle savedCattle = cattleRepository.save(cattle);

        Map<String, Object> blockData = new HashMap<>();
        blockData.put("cattleId", savedCattle.getId());
        blockData.put("rfidTag", savedCattle.getRfidTag());
        blockData.put("earTagNumber", savedCattle.getEarTagNumber());
        blockData.put("weight", request.getWeight());
        blockData.put("recordedBy", recordedBy);
        blockData.put("method", request.getMethod());
        blockData.put("source", request.getSource());
        blockData.put("note", request.getNote());

               blockchainService.createBlock(
                "CATTLE_WEIGHT_RECORDED",
                blockData,
                recordedBy,
                role
        );

        // Ghi nhật ký Audit Log
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("cattleId", savedCattle.getId());
        auditDetails.put("rfidTag", savedCattle.getRfidTag());
        auditDetails.put("earTagNumber", savedCattle.getEarTagNumber());
        auditDetails.put("weight", request.getWeight());
        auditDetails.put("method", request.getMethod());
        auditDetails.put("source", request.getSource());

        auditLogService.createLog(
                recordedBy,
                role,
                "CATTLE_WEIGHT_RECORDED",
                "CATTLE",
                savedCattle.getId(),
                "Ghi nhận cân nặng bò",
                auditDetails
        );

        return savedCattle;
    }

    @Override
    public void deleteCattle(String id) {

        if (!cattleRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bò có ID: " + id);
        }

        cattleRepository.deleteById(id);
    }

    @Override
    public List<Cattle> searchCattle(
            String keyword,
            String status,
            String penId) {

        return cattleRepository.findAll().stream()

                .filter(cattle -> {
                    if (keyword == null || keyword.isBlank()) {
                        return true;
                    }

                    String search = keyword.trim().toLowerCase();

                    boolean matchRfid = cattle.getRfidTag() != null
                            && cattle.getRfidTag().toLowerCase().contains(search);

                    boolean matchEarTag = cattle.getEarTagNumber() != null
                            && cattle.getEarTagNumber().toLowerCase().contains(search);

                    return matchRfid || matchEarTag;
                })

                .filter(cattle ->
                        status == null || status.isBlank()
                        || (cattle.getStatus() != null
                        && cattle.getStatus().equalsIgnoreCase(status.trim()))
                )

                .filter(cattle ->
                        penId == null || penId.isBlank()
                        || (cattle.getPenId() != null
                        && cattle.getPenId().equalsIgnoreCase(penId.trim()))
                )

                .collect(Collectors.toList());
    }

    // Kiểm tra trạng thái có được phép xét xuất bán không
    private boolean isStatusEligible(String status) {

        if (status == null) {
            return false;
        }

        return status.equalsIgnoreCase("DANG_NUOI")
                || status.equalsIgnoreCase("HEALTHY")
                || status.equalsIgnoreCase("DU_DIEU_KIEN_XUAT_BAN")
                || status.equalsIgnoreCase("READY_FOR_SALE");
    }

    // Kiểm tra điều kiện xuất bán của một con bò
    
    @Override
    public SaleEligibilityResponse checkSaleEligibility(String cattleId) {

        Cattle cattle = cattleRepository.findById(cattleId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy bò có ID: " + cattleId));

        SaleEligibilityResponse response = new SaleEligibilityResponse();

        response.setCattleId(cattle.getId());
        response.setRfidTag(cattle.getRfidTag());
        response.setEarTagNumber(cattle.getEarTagNumber());
        response.setCattleName(cattle.getName());
        response.setStatus(cattle.getStatus());
        response.setCurrentWeight(cattle.getWeight());
        response.setTargetMarketWeight(cattle.getTargetMarketWeight());

        List<String> reasons = new ArrayList<>();

        // 1. Kiểm tra trạng thái bò
        boolean statusEligible = isStatusEligible(cattle.getStatus());
        response.setStatusEligible(statusEligible);

        if (!statusEligible) {
            reasons.add("Trạng thái bò hiện tại không được phép xuất bán.");
        }

        // 2. Kiểm tra khối lượng
        boolean weightEligible = cattle.getTargetMarketWeight() > 0
                && cattle.getWeight() >= cattle.getTargetMarketWeight();

        response.setWeightEligible(weightEligible);

        if (cattle.getTargetMarketWeight() <= 0) {
            reasons.add("Chưa thiết lập khối lượng mục tiêu xuất bán.");
        } else if (!weightEligible) {
            reasons.add("Khối lượng hiện tại chưa đạt khối lượng mục tiêu.");
        }

        // 3. Kiểm tra toàn bộ hồ sơ thuốc
        boolean withdrawalEligible = true;
        boolean hasMedicationConfirmation = false;
        boolean hasWaitingWithdrawal = false;
        boolean hasCompletedWithdrawal = false;

        LocalDate today = LocalDate.now();
        LocalDate latestWithdrawalEndDate = null;

        List<HealthRecord> healthRecords =
                healthRecordRepository.findByCattleIdOrderByCreatedAtDesc(cattleId);

        if (healthRecords == null || healthRecords.isEmpty()) {

            withdrawalEligible = false;
            response.setWithdrawalStatus("NOT_CONFIRMED");

            reasons.add(
                    "Chưa có hồ sơ xác nhận tình trạng sử dụng thuốc và thời gian ngừng thuốc."
            );

        } else {

            for (HealthRecord record : healthRecords) {

                String medicine = record.getMedicine();
                String withdrawalStatus = record.getWithdrawalStatus();

                if (withdrawalStatus == null || withdrawalStatus.isBlank()
                        || "NOT_CONFIRMED".equalsIgnoreCase(withdrawalStatus)) {

                    withdrawalEligible = false;

                    if (medicine != null && !medicine.isBlank()) {
                        hasMedicationConfirmation = true;
                    }

                    String reason =
                            "Hồ sơ sức khỏe ngày "
                            + record.getExaminationDate()
                            + " chưa được xác nhận tình trạng ngừng thuốc.";

                    if (!reasons.contains(reason)) {
                        reasons.add(reason);
                    }

                    continue;
                }

                // Không cần ngừng thuốc: phải được FARM_MANAGER xác nhận
                if ("NO_WITHDRAWAL_REQUIRED".equalsIgnoreCase(withdrawalStatus)) {
                    hasMedicationConfirmation = true;
                    continue;
                }

                // Chỉ chấp nhận WAITING hoặc COMPLETED
                if (!"WAITING".equalsIgnoreCase(withdrawalStatus)
                        && !"COMPLETED".equalsIgnoreCase(withdrawalStatus)) {

                    withdrawalEligible = false;

                    String reason = "Trạng thái ngừng thuốc không hợp lệ.";

                    if (!reasons.contains(reason)) {
                        reasons.add(reason);
                    }

                    continue;
                }

                hasMedicationConfirmation = true;

                // Hồ sơ đang chờ hoặc đã hoàn thành phải có đủ dữ liệu
                Integer withdrawalDays = record.getWithdrawalPeriodDays();
                String endDate = record.getWithdrawalEndDate();

                if (medicine == null || medicine.isBlank()
                        || withdrawalDays == null
                        || withdrawalDays < 0
                        || endDate == null || endDate.isBlank()) {

                    withdrawalEligible = false;

                    String reason =
                            "Hồ sơ sử dụng thuốc chưa có đầy đủ thông tin ngừng thuốc.";

                    if (!reasons.contains(reason)) {
                        reasons.add(reason);
                    }

                    continue;
                }

                try {

                    LocalDate withdrawalDate = LocalDate.parse(endDate);

                    if (record.getTreatmentEndDate() == null
                            || record.getTreatmentEndDate().isBlank()) {

                        withdrawalEligible = false;

                        reasons.add(
                                "Hồ sơ thuốc thiếu ngày kết thúc điều trị để đối chiếu."
                        );

                        continue;
                    }

                    LocalDate treatmentEndDate =
                            LocalDate.parse(record.getTreatmentEndDate());

                    LocalDate minimumWithdrawalDate =
                            treatmentEndDate.plusDays(withdrawalDays);

                    if (withdrawalDate.isBefore(minimumWithdrawalDate)) {

                        withdrawalEligible = false;

                        reasons.add(
                                "Ngày kết thúc ngừng thuốc không phù hợp với số ngày ngừng thuốc."
                        );

                        continue;
                    }

                    if (latestWithdrawalEndDate == null
                            || withdrawalDate.isAfter(latestWithdrawalEndDate)) {
                        latestWithdrawalEndDate = withdrawalDate;
                    }

                    // WAITING không được tự động chuyển thành COMPLETED
                    if ("WAITING".equalsIgnoreCase(withdrawalStatus)) {

                        if (!today.isAfter(withdrawalDate)) {

                            withdrawalEligible = false;
                            hasWaitingWithdrawal = true;

                            String reason =
                                    "Bò chưa hoàn thành thời gian ngừng thuốc đến ngày "
                                    + withdrawalDate + ".";

                            if (!reasons.contains(reason)) {
                                reasons.add(reason);
                            }

                        } else {

                            withdrawalEligible = false;

                            String reason =
                                    "Thời gian ngừng thuốc đã qua nhưng FARM_MANAGER chưa xác nhận hoàn thành.";

                            if (!reasons.contains(reason)) {
                                reasons.add(reason);
                            }
                        }
                    }

                    // COMPLETED chỉ hợp lệ sau ngày kết thúc
                    if ("COMPLETED".equalsIgnoreCase(withdrawalStatus)) {

                        if (!today.isAfter(withdrawalDate)) {

                            withdrawalEligible = false;

                            String reason =
                                    "Hồ sơ đã xác nhận hoàn thành nhưng chưa qua ngày kết thúc ngừng thuốc.";

                            if (!reasons.contains(reason)) {
                                reasons.add(reason);
                            }

                        } else {
                            hasCompletedWithdrawal = true;
                        }
                    }

                } catch (Exception e) {

                    withdrawalEligible = false;

                    String reason =
                            "Thông tin ngày điều trị hoặc ngày kết thúc ngừng thuốc không hợp lệ.";

                    if (!reasons.contains(reason)) {
                        reasons.add(reason);
                    }
                }
            }

            if (!hasMedicationConfirmation) {
                withdrawalEligible = false;

                String reason =
                        "Chưa có xác nhận tình trạng sử dụng thuốc của bò.";

                if (!reasons.contains(reason)) {
                    reasons.add(reason);
                }
            }

            String finalWithdrawalStatus;

            if (!withdrawalEligible) {
                if (hasWaitingWithdrawal) {
                    finalWithdrawalStatus = "WAITING";
                } else {
                    finalWithdrawalStatus = "NOT_CONFIRMED";
                }
            } else if (hasCompletedWithdrawal) {
                finalWithdrawalStatus = "COMPLETED";
            } else {
                finalWithdrawalStatus = "NO_WITHDRAWAL_REQUIRED";
            }

            response.setWithdrawalStatus(finalWithdrawalStatus);
        }

        response.setWithdrawalEligible(withdrawalEligible);

        if (latestWithdrawalEndDate != null) {
            response.setWithdrawalEndDate(latestWithdrawalEndDate.toString());
        }

        // 4. Kết luận
        boolean eligible = statusEligible
                && weightEligible
                && withdrawalEligible;

        response.setEligible(eligible);

        if (eligible) {
            response.setMessage("Bò đủ điều kiện xuất bán.");
        } else {
            response.setMessage(String.join(" ", reasons));
        }

        return response;
    }


    // Lấy danh sách bò đủ điều kiện xuất bán
    @Override
    public List<SaleEligibilityResponse> getEligibleCattleForSale() {

        return cattleRepository.findAll().stream()
                .map(cattle -> checkSaleEligibility(cattle.getId()))
                .filter(SaleEligibilityResponse::isEligible)
                .collect(Collectors.toList());
    }

    // FARM_MANAGER xác nhận bò đủ điều kiện xuất bán
    @Override
    public SaleEligibilityResponse confirmSaleEligibility(
            String cattleId,
            String confirmedBy) {

        SaleEligibilityResponse response = checkSaleEligibility(cattleId);

        if (!response.isEligible()) {
            throw new IllegalArgumentException(
                    "Không thể xác nhận xuất bán: " + response.getMessage()
            );
        }

        Cattle cattle = cattleRepository.findById(cattleId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy bò có ID: " + cattleId));

        cattle.setStatus("DU_DIEU_KIEN_XUAT_BAN");

        Cattle savedCattle = cattleRepository.save(cattle);

        Map<String, Object> blockData = new HashMap<>();
        blockData.put("cattleId", savedCattle.getId());
        blockData.put("rfidTag", savedCattle.getRfidTag());
        blockData.put("earTagNumber", savedCattle.getEarTagNumber());
        blockData.put("cattleName", savedCattle.getName());
        blockData.put("weight", savedCattle.getWeight());
        blockData.put("targetMarketWeight", savedCattle.getTargetMarketWeight());
        blockData.put("status", savedCattle.getStatus());

                blockchainService.createBlock(
                "SALE_ELIGIBILITY_CONFIRMED",
                blockData,
                confirmedBy,
                "FARM_MANAGER"
        );

        // Ghi nhật ký Audit Log
        Map<String, Object> auditDetails = new HashMap<>();
        auditDetails.put("cattleId", savedCattle.getId());
        auditDetails.put("rfidTag", savedCattle.getRfidTag());
        auditDetails.put("earTagNumber", savedCattle.getEarTagNumber());
        auditDetails.put("cattleName", savedCattle.getName());
        auditDetails.put("weight", savedCattle.getWeight());
        auditDetails.put("status", savedCattle.getStatus());

        auditLogService.createLog(
                confirmedBy,
                "FARM_MANAGER",
                "SALE_ELIGIBILITY_CONFIRMED",
                "CATTLE",
                savedCattle.getId(),
                "Quản lý xác nhận bò đủ điều kiện xuất bán",
                auditDetails
        );

        return checkSaleEligibility(cattleId);
    }
}
