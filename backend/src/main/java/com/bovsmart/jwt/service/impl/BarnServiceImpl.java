package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.CattleTransferRequest;
import com.bovsmart.jwt.dto.request.BarnCleaningRequest;
import com.bovsmart.jwt.model.Barn;
import com.bovsmart.jwt.model.BarnCapacityCheck;
import com.bovsmart.jwt.model.BarnCleaningLog;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.CattleTransfer;
import com.bovsmart.jwt.repository.BarnRepository;
import com.bovsmart.jwt.repository.BarnCapacityCheckRepository;
import com.bovsmart.jwt.repository.BarnCleaningLogRepository;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.CattleTransferRepository;
import com.bovsmart.jwt.service.BarnService;
import com.bovsmart.jwt.security.services.UserDetailsImpl;

import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
public class BarnServiceImpl implements BarnService {

    private final BarnRepository barnRepository;
    private final CattleRepository cattleRepository;
    private final BarnCapacityCheckRepository checkRepository;
    private final CattleTransferRepository transferRepository;
    private final BarnCleaningLogRepository cleaningLogRepository;

    public BarnServiceImpl(
            BarnRepository barnRepository,
            CattleRepository cattleRepository,
            BarnCapacityCheckRepository checkRepository,
            CattleTransferRepository transferRepository,
            BarnCleaningLogRepository cleaningLogRepository) {

        this.barnRepository = barnRepository;
        this.cattleRepository = cattleRepository;
        this.checkRepository = checkRepository;
        this.transferRepository = transferRepository;
        this.cleaningLogRepository = cleaningLogRepository;
    }

    @Override
    public Barn createBarn(Barn barn) {
        validateBarn(barn);

        if (barn.getCode() == null || barn.getCode().isBlank()) {
            throw new IllegalArgumentException("Mã chuồng không được để trống!");
        }

        if (barnRepository.existsByCode(barn.getCode())) {
            throw new IllegalArgumentException("Mã chuồng đã tồn tại!");
        }

        return barnRepository.save(barn);
    }

    @Override
    public List<Barn> getAllBarns() {
        List<Barn> barns = barnRepository.findAll();

        for (Barn barn : barns) {
            long actualCount = cattleRepository.countByPenIdAndStatusNotIn(
                    barn.getCode(),
                    List.of("DA_XUAT_BAN", "SOLD")
            );

            barn.setCurrentCount((int) actualCount);
        }

        return barns;
    }

    @Override
    public Optional<Barn> getBarnById(String id) {
        return barnRepository.findById(id);
    }

    @Override
    public Barn updateBarn(String id, Barn barn) {
        Barn existingBarn = barnRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chuồng có ID: " + id));

        validateBarn(barn);

        if (barn.getCode() == null || barn.getCode().isBlank()) {
            throw new IllegalArgumentException("Mã chuồng không được để trống!");
        }

        Optional<Barn> barnWithCode = barnRepository.findByCode(barn.getCode());

        if (barnWithCode.isPresent()
                && !barnWithCode.get().getId().equals(id)) {
            throw new IllegalArgumentException("Mã chuồng đã tồn tại!");
        }

        barn.setId(existingBarn.getId());
        return barnRepository.save(barn);
    }

    @Override
    public void deleteBarn(String id) {
        if (!barnRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy chuồng có ID: " + id);
        }

        barnRepository.deleteById(id);
    }

    @Override
    public Map<String, Object> checkCapacity(String code) {
        Barn barn = barnRepository.findByCode(code)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chuồng có mã: " + code));

       long currentCount = cattleRepository.countByPenIdAndStatusNotIn(
                code,
                List.of("DA_XUAT_BAN", "SOLD")
        );

        int capacity = barn.getCapacity();
        int availableSlots = (int) Math.max(0, capacity - currentCount);
        boolean overCapacity = currentCount > capacity;

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("barnCode", barn.getCode());
        result.put("barnName", barn.getName());
        result.put("capacity", capacity);
        result.put("currentCount", currentCount);
        result.put("availableSlots", availableSlots);
        result.put("overCapacity", overCapacity);
        result.put("status", overCapacity ? "OVER_CAPACITY" : "NORMAL");

        return result;
    }

    @Override
    public BarnCapacityCheck confirmCapacityCheck(String code) {
        Barn barn = barnRepository.findByCode(code)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chuồng có mã: " + code));

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Vui lòng đăng nhập để xác nhận kiểm tra!");
        }

        long currentCount = cattleRepository.countByPenIdAndStatusNotIn(
                code,
                List.of("DA_XUAT_BAN", "SOLD")
        );

        int capacity = barn.getCapacity();

        BarnCapacityCheck check = new BarnCapacityCheck();
        check.setBarnCode(barn.getCode());
        check.setBarnName(barn.getName());
        check.setCapacity(capacity);
        check.setCurrentCount(currentCount);
        check.setAvailableSlots((int) Math.max(0, capacity - currentCount));
        check.setOverCapacity(currentCount > capacity);
        check.setCheckedBy(authentication.getName());
        check.setCheckedAt(LocalDateTime.now().toString());
        check.setConfirmed(true);

        return checkRepository.save(check);
    }

    @Override
    public List<BarnCapacityCheck> getCapacityCheckHistory(String code) {
        return checkRepository.findByBarnCodeOrderByCheckedAtDesc(code);
    }

    // Điều chuyển bò giữa các chuồng
    @Override
    public CattleTransfer transferCattle(
            String cattleId, CattleTransferRequest request) {

        // 1. Chỉ FARM_MANAGER được điều chuyển bò
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Vui lòng đăng nhập để điều chuyển bò!");
        }

        boolean isFarmManager = authentication.getAuthorities()
                .stream()
                .anyMatch(authority ->
                        "ROLE_FARM_MANAGER".equals(authority.getAuthority()));

        if (!isFarmManager) {
            throw new RuntimeException(
                    "Bạn không có quyền điều chuyển bò! Chỉ Quản lý trang trại được thực hiện nghiệp vụ này.");
        }

        // 2. Kiểm tra thông tin bò
        Cattle cattle = cattleRepository.findById(cattleId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy bò có ID: " + cattleId));

        if (!"DANG_NUOI".equals(cattle.getStatus())) {
            throw new IllegalArgumentException(
                    "Chỉ được điều chuyển bò đang nuôi!");
        }

        if (request == null
                || request.getToBarnCode() == null
                || request.getToBarnCode().isBlank()) {
            throw new IllegalArgumentException(
                    "Mã chuồng đích không được để trống!");
        }

        String fromBarnCode = cattle.getPenId();
        String toBarnCode = request.getToBarnCode().trim();

        if (toBarnCode.equals(fromBarnCode)) {
            throw new IllegalArgumentException(
                    "Chuồng đích phải khác chuồng hiện tại!");
        }

        // 3. Kiểm tra chuồng nguồn và chuồng đích
        Barn sourceBarn = barnRepository.findByCode(fromBarnCode)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chuồng hiện tại!"));

        Barn destinationBarn = barnRepository.findByCode(toBarnCode)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chuồng đích!"));

        // 4. Đếm bò trong chuồng đích
        // Dùng cùng điều kiện với getAllBarns() và checkCapacity()
        long destinationCount =
                cattleRepository.countByPenIdAndStatusNotIn(
                        toBarnCode,
                        List.of("DA_XUAT_BAN", "SOLD")
                );

        if (destinationCount >= destinationBarn.getCapacity()) {
            throw new IllegalArgumentException(
                    "Chuồng đích đã đầy, không thể điều chuyển bò!");
        }

        // 5. Cập nhật chuồng của bò
        cattle.setPenId(toBarnCode);
        cattleRepository.save(cattle);

        // 6. Lưu lịch sử điều chuyển
        CattleTransfer transfer = new CattleTransfer();
        transfer.setCattleId(cattle.getId());
        transfer.setCattleName(cattle.getName());
        transfer.setRfidTag(cattle.getRfidTag());
        transfer.setFromBarnCode(sourceBarn.getCode());
        transfer.setToBarnCode(destinationBarn.getCode());
        transfer.setTransferredBy(authentication.getName());
        transfer.setTransferredAt(LocalDateTime.now().toString());
        transfer.setNote(request.getNote());

        return transferRepository.save(transfer);
    }


    @Override
    public List<CattleTransfer> getCattleTransferHistory(String cattleId) {
        return transferRepository
                .findByCattleIdOrderByTransferredAtDesc(cattleId);
    }

    // Ghi nhận nhật ký vệ sinh chuồng
    @Override
    public BarnCleaningLog createCleaningLog(
            String barnCode, BarnCleaningRequest request) {

        Barn barn = barnRepository.findByCode(barnCode)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy chuồng có mã: " + barnCode));

        if (request.getCleaningDate() == null
                || request.getCleaningDate().isBlank()) {
            throw new IllegalArgumentException("Ngày vệ sinh không được để trống!");
        }

        if (request.getCleaningType() == null
                || request.getCleaningType().isBlank()) {
            throw new IllegalArgumentException("Loại vệ sinh không được để trống!");
        }

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Vui lòng đăng nhập để ghi nhận vệ sinh!");
        }

        BarnCleaningLog log = new BarnCleaningLog();
        log.setBarnCode(barn.getCode());
        log.setBarnName(barn.getName());
        log.setCleaningDate(request.getCleaningDate());
        log.setCleaningType(request.getCleaningType());
        log.setDescription(request.getDescription());
        Object principal = authentication.getPrincipal();

        if (principal instanceof UserDetailsImpl userDetails) {
            log.setCleanedBy(userDetails.getEmail());
        } else {
            log.setCleanedBy(authentication.getName());
        }
        
        log.setCreatedAt(LocalDateTime.now().toString());

        barn.setLastCleaned(request.getCleaningDate());
        barnRepository.save(barn);

        return cleaningLogRepository.save(log);
    }

    @Override
    public List<BarnCleaningLog> getCleaningHistory(String barnCode) {
        return cleaningLogRepository
                .findByBarnCodeOrderByCreatedAtDesc(barnCode);
    }

    private void validateBarn(Barn barn) {
        if (barn.getName() == null || barn.getName().isBlank()) {
            throw new IllegalArgumentException("Tên chuồng không được để trống!");
        }

        if (barn.getCapacity() <= 0) {
            throw new IllegalArgumentException("Sức chứa phải lớn hơn 0!");
        }

        if (barn.getCurrentCount() < 0) {
            throw new IllegalArgumentException("Số bò hiện tại không được âm!");
        }

        if (barn.getCurrentCount() > barn.getCapacity()) {
            throw new IllegalArgumentException(
                    "Số bò hiện tại không được vượt quá sức chứa!");
        }
    }
}