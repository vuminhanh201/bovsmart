
package com.bovsmart.jwt.security.jwt;

import com.bovsmart.jwt.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {

    private static final Logger logger =
            LoggerFactory.getLogger(AuthTokenFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String jwt = parseJwt(request);

            logger.info("========== JWT FILTER ==========");
            logger.info("Request URI: {}", request.getRequestURI());
            logger.info("JWT có tồn tại: {}", jwt != null);

            logger.info("Authentication trước filter: {}",
                    SecurityContextHolder.getContext().getAuthentication());

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {

                String username = jwtUtils.getUserNameFromJwtToken(jwt);
                logger.info("JWT hợp lệ, username: {}", username);

                UserDetails userDetails =
                        userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);

                logger.info("Authentication sau khi set: {}",
                        SecurityContextHolder.getContext().getAuthentication() != null);

                logger.info("Username: {}", userDetails.getUsername());

                logger.info("Authorities: {}",
                        authentication.getAuthorities());

            } else {
                logger.warn("JWT không tồn tại hoặc không hợp lệ");
            }

        } catch (Exception e) {
            logger.error("Không thể thiết lập xác thực người dùng", e);
            SecurityContextHolder.clearContext();
        }

        logger.info("Authentication trước khi qua filter tiếp theo: {}",
                SecurityContextHolder.getContext().getAuthentication());

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {

        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth)
                && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
}
