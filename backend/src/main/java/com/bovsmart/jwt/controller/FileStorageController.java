
package com.bovsmart.jwt.controller;

import com.bovsmart.jwt.dto.response.FileUploadResponse;
import com.bovsmart.jwt.dto.response.FileUrlResponse;
import com.bovsmart.jwt.dto.response.ResponseModel;
import com.bovsmart.jwt.service.FileStorageService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileStorageController {

    private final FileStorageService fileStorageService;

    public FileStorageController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    // Upload ảnh
    @PostMapping("/upload/image")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<FileUploadResponse>> uploadImage(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        String role = authentication.getAuthorities()
                .stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("UNKNOWN")
                .replace("ROLE_", "");

        FileUploadResponse response = fileStorageService.uploadImage(
                file,
                authentication.getName(),
                role
        );

        return ResponseEntity.ok(
                ResponseModel.success(response, "Upload ảnh thành công!")
        );
    }
    // Lấy URL xem ảnh
    @GetMapping("/{id}/url")
    @PreAuthorize("hasAnyRole('ADMIN','FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<FileUrlResponse>> getImageUrl(
            @PathVariable String id
    ) {

        FileUrlResponse response =
                fileStorageService.getImageUrl(id);

        return ResponseEntity.ok(
                ResponseModel.success(
                        response,
                        "Lấy URL ảnh thành công!"
                )
        );
    }

    // Lấy danh sách ảnh của người đăng nhập
    @GetMapping("/my-images")
    @PreAuthorize("hasAnyRole('ADMIN', 'FARM_MANAGER', 'STAFF')")
    public ResponseEntity<ResponseModel<List<FileUploadResponse>>> getMyImages(
            Authentication authentication
    ) {

        List<FileUploadResponse> response =
                fileStorageService.getMyImages(
                        authentication.getName()
                );

        return ResponseEntity.ok(
                ResponseModel.success(
                        response,
                        "Lấy danh sách ảnh thành công!"
                )
        );
    }
}
