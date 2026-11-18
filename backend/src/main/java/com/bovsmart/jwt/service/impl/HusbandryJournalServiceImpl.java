
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.HusbandryJournalRequest;
import com.bovsmart.jwt.model.HusbandryJournal;
import com.bovsmart.jwt.repository.HusbandryJournalRepository;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.service.HusbandryJournalService;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class HusbandryJournalServiceImpl implements HusbandryJournalService {

    private final HusbandryJournalRepository journalRepository;
    private final CattleRepository cattleRepository;

    public HusbandryJournalServiceImpl(
            HusbandryJournalRepository journalRepository,
            CattleRepository cattleRepository) {
        this.journalRepository = journalRepository;
        this.cattleRepository = cattleRepository;
    }

    @Override
    public HusbandryJournal createJournal(
            HusbandryJournalRequest request, String performedBy) {

        validateRequest(request);

        HusbandryJournal journal = new HusbandryJournal();

        journal.setJournalCode("JOURNAL-" +
                UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        journal.setCattleId(request.getCattleId());

        if (request.getCattleId() != null
                && !request.getCattleId().isBlank()) {

            var cattle = cattleRepository.findById(request.getCattleId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy bò"));

            journal.setRfidTag(cattle.getRfidTag());
            journal.setEarTagNumber(cattle.getEarTagNumber());
        }

        journal.setBarnId(request.getBarnId());
        journal.setWorkType(request.getWorkType());
        journal.setTitle(request.getTitle());
        journal.setContent(request.getContent());

        journal.setPerformedAt(
                request.getPerformedAt() != null
                        ? request.getPerformedAt()
                        : LocalDateTime.now());

        journal.setPerformedBy(performedBy);
        journal.setCreatedAt(LocalDateTime.now());
        journal.setUpdatedAt(LocalDateTime.now());

        return journalRepository.save(journal);
    }

    @Override
    public HusbandryJournal updateJournal(
            String id,
            HusbandryJournalRequest request,
            String updatedBy,
            boolean isFarmManager) {

        validateRequest(request);

        HusbandryJournal journal = journalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy nhật ký"));

        if (!isFarmManager
                && !journal.getPerformedBy().equals(updatedBy)) {
            throw new IllegalArgumentException(
                    "Bạn chỉ được cập nhật nhật ký do mình tạo");
        }

        journal.setCattleId(request.getCattleId());
        journal.setRfidTag(null);
        journal.setEarTagNumber(null);

        if (request.getCattleId() != null
                && !request.getCattleId().isBlank()) {

            var cattle = cattleRepository.findById(request.getCattleId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy bò"));

            journal.setRfidTag(cattle.getRfidTag());
            journal.setEarTagNumber(cattle.getEarTagNumber());
        }

        journal.setBarnId(request.getBarnId());
        journal.setWorkType(request.getWorkType());
        journal.setTitle(request.getTitle());
        journal.setContent(request.getContent());

        if (request.getPerformedAt() != null) {
            journal.setPerformedAt(request.getPerformedAt());
        }

        journal.setUpdatedAt(LocalDateTime.now());

        return journalRepository.save(journal);
    }

    @Override
    public List<HusbandryJournal> getAllJournals() {
        return journalRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getPerformedAt()
                        .compareTo(a.getPerformedAt()))
                .toList();
    }

    @Override
    public List<HusbandryJournal> getMyJournals(String performedBy) {
        return journalRepository
                .findByPerformedByOrderByPerformedAtDesc(performedBy);
    }

    @Override
    public List<HusbandryJournal> getJournalsByCattleId(String cattleId) {
        if (!cattleRepository.existsById(cattleId)) {
            throw new IllegalArgumentException("Không tìm thấy bò");
        }

        return journalRepository
                .findByCattleIdOrderByPerformedAtDesc(cattleId);
    }

    @Override
    public List<HusbandryJournal> getJournalsByBarnId(String barnId) {
        return journalRepository
                .findByBarnIdOrderByPerformedAtDesc(barnId);
    }

    @Override
    public HusbandryJournal getJournalById(String id) {
        return journalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy nhật ký"));
    }

    private void validateRequest(HusbandryJournalRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Dữ liệu nhật ký không được để trống");
        }

        if (request.getWorkType() == null
                || request.getWorkType().isBlank()) {
            throw new IllegalArgumentException(
                    "Loại công việc không được để trống");
        }

        if (request.getTitle() == null
                || request.getTitle().isBlank()) {
            throw new IllegalArgumentException(
                    "Tiêu đề không được để trống");
        }

        if (request.getContent() == null
                || request.getContent().isBlank()) {
            throw new IllegalArgumentException(
                    "Nội dung không được để trống");
        }

        if (request.getPerformedAt() != null
                && request.getPerformedAt().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException(
                    "Thời gian thực hiện không được ở tương lai");
        }
    }
}
