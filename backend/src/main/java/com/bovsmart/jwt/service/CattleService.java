package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.Cattle;
import com.bovsmart.jwt.dto.request.WeightRecordRequest;
import com.bovsmart.jwt.dto.response.SaleEligibilityResponse;

import java.util.List;
import java.util.Optional;

public interface CattleService {    

    Cattle createCattle(Cattle cattle, String createdBy, String role);

    List<Cattle> getAllCattle();

    List<Cattle> searchCattle(String keyword, String status, String penId);

    Optional<Cattle> getCattleById(String id);

    // Tìm bò bằng mã RFID mô phỏng
    Optional<Cattle> getCattleByRfidTag(String rfidTag);

    Cattle updateCattle(String id, Cattle cattle, String updatedBy, String role);

    void deleteCattle(String id);

    // Ghi nhận lần cân mới, không ghi đè lịch sử cũ
    Cattle recordWeight(
            String id,
            WeightRecordRequest request,
            String recordedBy,
            String role
    );

    // Kiểm tra điều kiện xuất bán của một con bò
    SaleEligibilityResponse checkSaleEligibility(String cattleId);

    // Lấy danh sách bò đủ điều kiện xuất bán
    List<SaleEligibilityResponse> getEligibleCattleForSale();

    // FARM_MANAGER xác nhận bò đủ điều kiện xuất bán
    SaleEligibilityResponse confirmSaleEligibility(String cattleId, String confirmedBy);
}
