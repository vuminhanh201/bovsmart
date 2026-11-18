package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.RefreshToken;
import com.bovsmart.jwt.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUser_Id(String userId);

    void deleteByUser(User user);

    void deleteByUser_Id(String userId);
}

