
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.CattleUpdateRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CattleUpdateRequestRepository
        extends MongoRepository<CattleUpdateRequest, String> {

    // Lấy danh sách yêu cầu theo trạng thái
    List<CattleUpdateRequest> findByRequestStatusOrderByCreatedAtDesc(
            String requestStatus
    );

    // Lấy lịch sử yêu cầu của một con bò
    List<CattleUpdateRequest> findByCattleIdOrderByCreatedAtDesc(
            String cattleId
    );

    // Kiểm tra bò có yêu cầu đang chờ duyệt không
    boolean existsByCattleIdAndRequestStatus(
            String cattleId,
            String requestStatus
    );
}
