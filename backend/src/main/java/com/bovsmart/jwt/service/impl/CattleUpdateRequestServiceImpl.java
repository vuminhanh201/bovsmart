
package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.dto.request.CattleUpdateRequestDTO;
import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.model.CattleUpdateRequest;
import com.bovsmart.jwt.repository.CattleRepository;
import com.bovsmart.jwt.repository.CattleUpdateRequestRepository;
import com.bovsmart.jwt.service.CattleUpdateRequestService;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CattleUpdateRequestServiceImpl
        implements CattleUpdateRequestService {

    private final CattleRepository cattleRepository;
    private final CattleUpdateRequestRepository requestRepository;

    public CattleUpdateRequestServiceImpl(
            CattleRepository cattleRepository,
            CattleUpdateRequestRepository requestRepository) {
        this.cattleRepository = cattleRepository;
        this.requestRepository = requestRepository;
    }

    // Tạo yêu cầu cập nhật RFID hoặc trạng thái bò
    @Override
    public CattleUpdateRequest createRequest(
            CattleUpdateRequestDTO requestDTO,
            String username) {

        if (requestDTO.getCattleId() == null
                || requestDTO.getCattleId().isBlank()) {
            throw new RuntimeException("Mã bò không được để trống");
        }

        if ((requestDTO.getRequestedRfidTag() == null
                || requestDTO.getRequestedRfidTag().isBlank())
                && (requestDTO.getRequestedStatus() == null
                || requestDTO.getRequestedStatus().isBlank())) {
            throw new RuntimeException(
                    "Phải nhập RFID mới hoặc trạng thái cần cập nhật");
        }

        Cattle cattle = cattleRepository.findById(
                requestDTO.getCattleId()
        ).orElseThrow(() ->
                new RuntimeException("Không tìm thấy bò"));

        String newRfid = requestDTO.getRequestedRfidTag();

        if (newRfid != null && !newRfid.isBlank()) {
            boolean duplicate = cattleRepository.existsByRfidTag(newRfid);

            if (duplicate && !newRfid.equals(cattle.getRfidTag())) {
                throw new RuntimeException("RFID đã được sử dụng");
            }
        }

        if (requestRepository.existsByCattleIdAndRequestStatus(
                cattle.getId(), "PENDING")) {
            throw new RuntimeException(
                    "Bò này đã có yêu cầu đang chờ duyệt");
        }

        CattleUpdateRequest request = new CattleUpdateRequest();
        request.setCattleId(cattle.getId());
        request.setCurrentRfidTag(cattle.getRfidTag());
        request.setRequestedRfidTag(
                newRfid == null || newRfid.isBlank() ? null : newRfid.trim());
        request.setRequestedStatus(
                requestDTO.getRequestedStatus() == null
                        || requestDTO.getRequestedStatus().isBlank()
                        ? null : requestDTO.getRequestedStatus().trim());
        request.setRequestStatus("PENDING");
        request.setRequestedBy(username);
        request.setCreatedAt(Instant.now());

        return requestRepository.save(request);
    }

    // Lấy danh sách yêu cầu đang chờ duyệt
    @Override
    public List<CattleUpdateRequest> getPendingRequests() {
        return requestRepository
                .findByRequestStatusOrderByCreatedAtDesc("PENDING");
    }

    // Duyệt yêu cầu và cập nhật thông tin bò
    @Override
    public CattleUpdateRequest approveRequest(
            String requestId,
            String username) {

        CattleUpdateRequest request = requestRepository.findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy yêu cầu"));

        if (!"PENDING".equals(request.getRequestStatus())) {
            throw new RuntimeException(
                    "Yêu cầu này đã được xử lý");
        }

        Cattle cattle = cattleRepository.findById(request.getCattleId())
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy bò"));

        String newRfid = request.getRequestedRfidTag();

        if (newRfid != null && !newRfid.isBlank()) {
            boolean duplicate = cattleRepository.existsByRfidTag(newRfid);

            if (duplicate && !newRfid.equals(cattle.getRfidTag())) {
                throw new RuntimeException(
                        "RFID đã được bò khác sử dụng");
            }

            cattle.setRfidTag(newRfid);
        }

        if (request.getRequestedStatus() != null
                && !request.getRequestedStatus().isBlank()) {
            cattle.setStatus(request.getRequestedStatus());
        }

        cattleRepository.save(cattle);

        request.setRequestStatus("APPROVED");
        request.setReviewedBy(username);
        request.setReviewedAt(Instant.now());

        return requestRepository.save(request);
    }

    // Từ chối yêu cầu
    @Override
    public CattleUpdateRequest rejectRequest(
            String requestId,
            String username,
            String reviewNote) {

        CattleUpdateRequest request = requestRepository.findById(requestId)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy yêu cầu"));

        if (!"PENDING".equals(request.getRequestStatus())) {
            throw new RuntimeException(
                    "Yêu cầu này đã được xử lý");
        }

        request.setRequestStatus("REJECTED");
        request.setReviewedBy(username);
        request.setReviewNote(reviewNote);
        request.setReviewedAt(Instant.now());

        return requestRepository.save(request);
    }
}
