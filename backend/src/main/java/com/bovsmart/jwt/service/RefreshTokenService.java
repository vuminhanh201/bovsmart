package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.RefreshToken;

import java.util.Optional;

public interface RefreshTokenService {

    Optional<RefreshToken> findByToken(String token);

    RefreshToken createRefreshToken(String userId);

    RefreshToken verifyExpiration(RefreshToken token);

    void deleteByUserId(String userId);
}

