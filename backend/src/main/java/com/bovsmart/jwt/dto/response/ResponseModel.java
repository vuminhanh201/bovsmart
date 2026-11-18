package com.bovsmart.jwt.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Cấu trúc trả về chuẩn theo yêu cầu:
 * 1. success : int (1: thành công, 0: thất bại)
 * 2. data : Object (Generic T)
 * 3. message : String
 */
@JsonInclude(JsonInclude.Include.ALWAYS)
public class ResponseModel<T> {

    private int success;
    private T data;
    private String message;

    public ResponseModel() {
    }

    public ResponseModel(int success, T data, String message) {
        this.success = success;
        this.data = data;
        this.message = message;
    }

    public static <T> ResponseModel<T> success(T data, String message) {
        return new ResponseModel<>(1, data, message);
    }

    public static <T> ResponseModel<T> success(T data) {
        return new ResponseModel<>(1, data, "Thao tác thành công!");
    }

    public static <T> ResponseModel<T> error(String message) {
        return new ResponseModel<>(0, null, message);
    }

    public static <T> ResponseModel<T> error(T data, String message) {
        return new ResponseModel<>(0, data, message);
    }

    public int getSuccess() {
        return success;
    }

    public void setSuccess(int success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

