
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.SalesOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SalesOrderRepository extends MongoRepository<SalesOrder, String> {

    Optional<SalesOrder> findByOrderCode(String orderCode);

    // Tìm phiếu theo một con bò (tương thích dữ liệu cũ)
    List<SalesOrder> findByCattleId(String cattleId);

    List<SalesOrder> findByCattleIdAndStatusIn(
            String cattleId,
            List<String> statuses
    );

    boolean existsByCattleIdAndStatusIn(
            String cattleId,
            List<String> statuses
    );

    // Tìm phiếu chứa bất kỳ con bò nào trong danh sách
    List<SalesOrder> findByCattleDetailsCattleIdInAndStatusIn(
            List<String> cattleIds,
            List<String> statuses
    );

    List<SalesOrder> findByCreatedBy(String createdBy);

    List<SalesOrder> findByStatus(String status);

    boolean existsByOrderCode(String orderCode);
}
