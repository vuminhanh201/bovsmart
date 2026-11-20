
package com.bovsmart.jwt.security.services;

import com.bovsmart.jwt.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class UserDetailsImpl implements UserDetails {

    private static final long serialVersionUID = 1L;

    private final String id;
    private final String username;
    private final String email;
    private final String department;

    @JsonIgnore
    private final String password;

    private final boolean enabled;
    private final Instant lockUntil;

    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(
            String id,
            String username,
            String email,
            String password,
            String department,
            boolean enabled,
            Instant lockUntil,
            Collection<? extends GrantedAuthority> authorities) {

        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.department = department;
        this.enabled = enabled;
        this.lockUntil = lockUntil;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {

        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.getDepartment(),
                user.isEnabled(),
                user.getLockUntil(),
                authorities
        );
    }

    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getDepartment() {
        return department;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return lockUntil == null || !lockUntil.isAfter(Instant.now());
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
