
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.HusbandryJournalRequest;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.model.HusbandryJournal;
import com.bovsmart.jwt.service.HusbandryJournalService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*", maxAge = 3600)
@RequestMapping("/api/husbandry-journals")
public class HusbandryJournalController {

    private final HusbandryJournalService journalService;

    public HusbandryJournalController(HusbandryJournalService journalService) {
        this.journalService = journalService;
    }

    // STAFF và FARM_MANAGER được thêm nhật ký
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HusbandryJournal>> createJournal(
            @RequestBody HusbandryJournalRequest request,
            Authentication authentication) {
        try {
            HusbandryJournal result = journalService.createJournal(
                    request, authentication.getName());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ResponseModel.success(
                            result, "Thêm nhật ký chăn nuôi thành công!"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // FARM_MANAGER xem toàn bộ nhật ký
    @GetMapping
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<HusbandryJournal>> getAllJournals() {
        return ResponseModel.success(
                journalService.getAllJournals(),
                "Lấy danh sách nhật ký chăn nuôi thành công!");
    }

    // STAFF xem nhật ký của mình
    @GetMapping("/my-journals")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseModel<List<HusbandryJournal>> getMyJournals(
            Authentication authentication) {
        return ResponseModel.success(
                journalService.getMyJournals(authentication.getName()),
                "Lấy nhật ký của tôi thành công!");
    }

    // FARM_MANAGER xem nhật ký theo bò
    @GetMapping("/cattle/{cattleId}")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<ResponseModel<List<HusbandryJournal>>> getJournalsByCattleId(
            @PathVariable String cattleId) {
        try {
            return ResponseEntity.ok(ResponseModel.success(
                    journalService.getJournalsByCattleId(cattleId),
                    "Lấy nhật ký theo bò thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // FARM_MANAGER xem nhật ký theo chuồng
    @GetMapping("/barn/{barnId}")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseModel<List<HusbandryJournal>> getJournalsByBarnId(
            @PathVariable String barnId) {
        return ResponseModel.success(
                journalService.getJournalsByBarnId(barnId),
                "Lấy nhật ký theo chuồng thành công!");
    }

    // STAFF và FARM_MANAGER xem chi tiết nhật ký
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HusbandryJournal>> getJournalById(
            @PathVariable String id) {
        try {
            return ResponseEntity.ok(ResponseModel.success(
                    journalService.getJournalById(id),
                    "Lấy chi tiết nhật ký thành công!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }

    // STAFF sửa nhật ký của mình, FARM_MANAGER sửa nhật ký toàn trang trại
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<ResponseModel<HusbandryJournal>> updateJournal(
            @PathVariable String id,
            @RequestBody HusbandryJournalRequest request,
            Authentication authentication) {
        try {
            boolean isFarmManager = authentication.getAuthorities()
                    .stream()
                    .anyMatch(authority ->
                            authority.getAuthority().equals("ROLE_FARM_MANAGER"));

            HusbandryJournal result = journalService.updateJournal(
                    id, request, authentication.getName(), isFarmManager);

            return ResponseEntity.ok(ResponseModel.success(
                    result, "Cập nhật nhật ký chăn nuôi thành công!"));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseModel.error(e.getMessage()));
        }
    }
}
