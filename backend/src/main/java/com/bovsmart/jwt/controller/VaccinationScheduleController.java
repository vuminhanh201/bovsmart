
package com.bovsmart.jwt.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.dto.request.VaccinationScheduleRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.VaccinationSchedule;
import com.bovsmart.jwt.service.VaccinationScheduleService;

import java.util.List;

@RestController
@RequestMapping("/api/vaccination-schedules")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VaccinationScheduleController {

    private final VaccinationScheduleService scheduleService;

    public VaccinationScheduleController(
            VaccinationScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    // FARM_MANAGER tạo lịch tiêm và giao cho nhân viên Thú y
    @PostMapping
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<VaccinationSchedule>> createSchedule(
            @RequestBody VaccinationScheduleRequest request,
            Authentication authentication) {

        try {
            UserDetailsImpl currentUser =
                    (UserDetailsImpl) authentication.getPrincipal();

            VaccinationSchedule result =
                    scheduleService.createSchedule(request, currentUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ResponseModel.success(
                            result, "Tạo lịch tiêm và giao nhiệm vụ thành công!"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage()));
        }
    }

    // FARM_MANAGER và ADMIN xem tất cả lịch tiêm
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<List<VaccinationSchedule>>> getAllSchedules() {
        try {
            return ResponseEntity.ok(
                    ResponseModel.success(
                            scheduleService.getAllSchedules(),
                            "Lấy danh sách lịch tiêm thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage()));
        }
    }

    // STAFF Thú y chỉ xem lịch được giao cho chính mình
    @GetMapping("/my-schedules")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<?> getMySchedules(Authentication authentication) {
        try {
            UserDetailsImpl currentUser =
                    (UserDetailsImpl) authentication.getPrincipal();

            return ResponseEntity.ok(
                    ResponseModel.success(
                            scheduleService.getSchedulesAssignedToVeterinarian(currentUser),
                            "Lấy lịch tiêm được giao thành công!"
                    )
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage())
            );
        }
    }
    // Xem chi tiết lịch
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<VaccinationSchedule>> getScheduleById(
            @PathVariable String id,
            Authentication authentication) {
        try {
            VaccinationSchedule schedule = scheduleService.getScheduleById(id);

            boolean isManagerOrAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_FARM_MANAGER")
                            || a.getAuthority().equals("ROLE_ADMIN"));

            boolean isAssignedStaff = schedule.getAssignedVeterinarianEmail()
                    .equalsIgnoreCase(authentication.getName());

            if (!isManagerOrAdmin && !isAssignedStaff) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        ResponseModel.error(
                                "Bạn không được phép xem lịch tiêm này"));
            }

            return ResponseEntity.ok(
                    ResponseModel.success(
                            schedule, "Lấy chi tiết lịch tiêm thành công!"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage()));
        }
    }

    // FARM_MANAGER cập nhật trạng thái lịch
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<VaccinationSchedule>> updateStatus(
            @PathVariable String id,
            @RequestParam String status,
            Authentication authentication) {
        try {
            UserDetailsImpl currentUser =
                    (UserDetailsImpl) authentication.getPrincipal();

            VaccinationSchedule result =
                    scheduleService.updateScheduleStatus(id, status, currentUser);

            return ResponseEntity.ok(
                    ResponseModel.success(
                            result, "Cập nhật trạng thái lịch tiêm thành công!"));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(
                    ResponseModel.error(e.getMessage()));
        }
    }
}
