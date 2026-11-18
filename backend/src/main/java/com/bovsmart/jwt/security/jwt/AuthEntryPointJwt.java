package com.bovsmart.jwt.security.jwt;

import com.bovsmart.jwt.dto.response.ResponseModel;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        logger.error("401 xảy ra tại URI: {}", request.getRequestURI(), authException);

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        ResponseModel<?> responseModel = ResponseModel.error(
                "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!"
        );

        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), responseModel);
    }
}

