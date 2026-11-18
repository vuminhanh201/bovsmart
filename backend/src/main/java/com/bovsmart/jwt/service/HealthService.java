
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.HealthRecordRequest;
import com.bovsmart.jwt.dto.response.VeterinaryStaffOption;
import com.bovsmart.jwt.model.HealthRecord;
import com.bovsmart.jwt.security.services.UserDetailsImpl;

import java.util.List;

public interface HealthService {

    // Chăm sóc bò hoặc quản lý tạo hồ sơ mới
    HealthRecord createHealthRecord(
            HealthRecordRequest request,
            UserDetailsImpl currentUser
    );

    // Nhân viên thú y cập nhật hồ sơ được giao
    HealthRecord updateHealthRecord(
            String id,
            HealthRecordRequest request,
            UserDetailsImpl currentUser
    );

    // Quản lý lấy danh sách nhân viên thú y
    List<VeterinaryStaffOption> getAvailableVeterinarians();

    // Quản lý phân công nhân viên thú y
    HealthRecord assignVeterinarian(
            String id,
            String vetId,
            UserDetailsImpl currentUser
    );

    // Thú y lấy danh sách hồ sơ được giao
    List<HealthRecord> getAssignedHealthRecords(
            UserDetailsImpl currentUser
    );

    List<HealthRecord> getAllHealthRecords();

    List<HealthRecord> getHealthRecordsByCattleId(String cattleId);

    HealthRecord getHealthRecordById(String id);

    // Quản lý xác nhận tình trạng ngừng thuốc
    HealthRecord confirmWithdrawalStatus(
            String id,
            String withdrawalStatus,
            String confirmedBy
    );
}
