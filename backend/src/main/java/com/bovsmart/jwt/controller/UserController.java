package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.security.services.UserDetailsImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/user")
public class UserController {

    /**
     * API xem thông tin cá nhân của tài khoản hiện tại (Yêu cầu gửi kèm Bearer Access Token)
     */
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResponseModel<Map<String, Object>>> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", userDetails.getId());
        profile.put("username", userDetails.getUsername());
        profile.put("email", userDetails.getEmail());
        profile.put("roles", userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));

        return ResponseEntity.ok(ResponseModel.success(profile, "Lấy thông tin tài khoản thành công!"));
    }
}

