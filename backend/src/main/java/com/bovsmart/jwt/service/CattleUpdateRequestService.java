
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.CattleUpdateRequestDTO;
import com.bovsmart.jwt.model.CattleUpdateRequest;

import java.util.List;

public interface CattleUpdateRequestService {

    // STAFF gửi yêu cầu cập nhật
    CattleUpdateRequest createRequest(
            CattleUpdateRequestDTO requestDTO,
            String username
    );

    // FARM_MANAGER xem danh sách yêu cầu
    List<CattleUpdateRequest> getPendingRequests();

    // FARM_MANAGER xác nhận yêu cầu
    CattleUpdateRequest approveRequest(
            String requestId,
            String username
    );

    // FARM_MANAGER từ chối yêu cầu
    CattleUpdateRequest rejectRequest(
            String requestId,
            String username,
            String reviewNote
    );
}
