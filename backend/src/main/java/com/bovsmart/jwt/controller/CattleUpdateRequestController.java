
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.request.CattleUpdateRequestDTO;
import com.bovsmart.jwt.model.CattleUpdateRequest;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import com.bovsmart.jwt.service.CattleUpdateRequestService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cattle/update-requests")
public class CattleUpdateRequestController {

    private final CattleUpdateRequestService requestService;

    public CattleUpdateRequestController(
            CattleUpdateRequestService requestService) {
        this.requestService = requestService;
    }

    // STAFF hoặc FARM_MANAGER gửi yêu cầu
    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'FARM_MANAGER')")
    public ResponseEntity<CattleUpdateRequest> createRequest(
            @RequestBody CattleUpdateRequestDTO requestDTO,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        CattleUpdateRequest request = requestService.createRequest(
                requestDTO,
                userDetails.getUsername()
        );

        return ResponseEntity.ok(request);
    }

    // FARM_MANAGER xem các yêu cầu đang chờ duyệt
    @GetMapping("/pending")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<List<CattleUpdateRequest>> getPendingRequests() {

        return ResponseEntity.ok(
                requestService.getPendingRequests()
        );
    }

    // FARM_MANAGER duyệt yêu cầu
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<CattleUpdateRequest> approveRequest(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(
                requestService.approveRequest(
                        id,
                        userDetails.getUsername()
                )
        );
    }

    // FARM_MANAGER từ chối yêu cầu
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('FARM_MANAGER')")
    public ResponseEntity<CattleUpdateRequest> rejectRequest(
            @PathVariable String id,
            @RequestParam(required = false) String reviewNote,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        return ResponseEntity.ok(
                requestService.rejectRequest(
                        id,
                        userDetails.getUsername(),
                        reviewNote
                )
        );
    }
}
