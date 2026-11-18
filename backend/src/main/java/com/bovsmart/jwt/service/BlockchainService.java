package com.bovsmart.jwt.service;

import com.bovsmart.jwt.model.BlockchainBlock;

import java.util.List;
import java.util.Map;

public interface BlockchainService {

    BlockchainBlock createBlock(
            String action,
            Map<String, Object> data,
            String operator,
            String role
    );

    List<BlockchainBlock> getAllBlocks();

    boolean verifyChain();
}