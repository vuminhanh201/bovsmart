package com.bovsmart.jwt.security;

import com.bovsmart.jwt.security.jwt.AuthEntryPointJwt;
import com.bovsmart.jwt.security.jwt.AuthTokenFilter;
import com.bovsmart.jwt.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phép frontend React Vite localhost:3000 kết nối
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .exceptionHandling(exception ->
                exception.authenticationEntryPoint(unauthorizedHandler)
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth

                // Cho phép xử lý lỗi
                .requestMatchers("/error").permitAll()

                // API nhật ký thao tác: chỉ ADMIN
                .requestMatchers("/api/audit-logs/**").hasRole("ADMIN")

                // API đăng nhập, đăng ký và quên mật khẩu
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/auth/refreshtoken",
                    "/api/auth/forgot-password",
                    "/api/auth/verify-reset-code",
                    "/api/auth/reset-password"
                ).permitAll()

                // API test công khai
                .requestMatchers("/api/test/public").permitAll()

                // API truy xuất nguồn gốc bằng QR - không cần đăng nhập
                .requestMatchers("/api/public/trace/**").permitAll()

                // Các API còn lại cần đăng nhập
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(
            authenticationJwtTokenFilter(),
            UsernamePasswordAuthenticationFilter.class
        );

        return http.build();
    }
    

    @Bean
    public FilterRegistrationBean<AuthTokenFilter> jwtFilterRegistration(
            AuthTokenFilter filter) {

        FilterRegistrationBean<AuthTokenFilter> registration =
                new FilterRegistrationBean<>(filter);

        registration.setEnabled(false);

        return registration;
    }
}

