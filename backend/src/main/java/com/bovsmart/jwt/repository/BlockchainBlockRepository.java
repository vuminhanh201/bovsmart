package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.BlockchainBlock;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlockchainBlockRepository
        extends MongoRepository<BlockchainBlock, String> {

    Optional<BlockchainBlock> findTopByOrderByIndexDesc();

    Optional<BlockchainBlock> findByIndex(long index);
}