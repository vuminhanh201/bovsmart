package com.bovsmart.jwt.exception;

import com.bovsmart.jwt.dto.response.ResponseModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

import javax.security.auth.login.AccountLockedException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bắt lỗi validation (@Valid DTO)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseModel<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseModel.error(errors, "Dữ liệu yêu cầu không hợp lệ!"));
    }

    /**
     * Bắt lỗi sai thông tin đăng nhập
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ResponseModel<?>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ResponseModel.error("Tên đăng nhập hoặc mật khẩu không chính xác!"));
    }

    /**
     * Bắt lỗi refresh token
     */
    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ResponseModel<?>> handleTokenRefreshException(TokenRefreshException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ResponseModel.error(ex.getMessage()));
    }

    /**
     * Bắt lỗi không có quyền truy cập
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseModel<?>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ResponseModel.error("Bạn không có quyền thực hiện thao tác này!"));
    }

    /**
     * Bắt lỗi business logic chung (AppException / IllegalArgumentException)
     */
    @ExceptionHandler({AppException.class, IllegalArgumentException.class})
    public ResponseEntity<ResponseModel<?>> handleBusinessException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ResponseModel.error(ex.getMessage()));
    }

    /**
     * Bắt các lỗi không lường trước khác
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseModel<?>> handleGlobalException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ResponseModel.error("Lỗi máy chủ nội bộ: " + ex.getMessage()));
    }
}


