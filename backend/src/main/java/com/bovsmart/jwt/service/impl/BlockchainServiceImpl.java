package com.bovsmart.jwt.service.impl;

import com.bovsmart.jwt.model.BlockchainBlock;
import com.bovsmart.jwt.repository.BlockchainBlockRepository;
import com.bovsmart.jwt.service.BlockchainService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class BlockchainServiceImpl implements BlockchainService {

    private static final String GENESIS_PREVIOUS_HASH = "0";

    private final BlockchainBlockRepository repository;
    private final ObjectMapper objectMapper;

    public BlockchainServiceImpl(
            BlockchainBlockRepository repository,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public synchronized BlockchainBlock createBlock(
            String action,
            Map<String, Object> data,
            String operator,
            String role
    ) {
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("Hành động không được để trống!");
        }

        BlockchainBlock previousBlock =
                repository.findTopByOrderByIndexDesc().orElse(null);

        BlockchainBlock block = new BlockchainBlock();

        block.setIndex(previousBlock == null ? 0 : previousBlock.getIndex() + 1);
        block.setTimestamp(LocalDateTime.now().toString());
        block.setAction(action.trim());
        block.setData(data == null ? Map.of() : data);
        block.setOperator(operator);
        block.setRole(role);

        block.setPreviousHash(
                previousBlock == null
                        ? GENESIS_PREVIOUS_HASH
                        : previousBlock.getHash()
        );

        block.setHash(calculateHash(block));

        return repository.save(block);
    }

    @Override
    public List<BlockchainBlock> getAllBlocks() {
        return repository.findAll()
                .stream()
                .sorted((a, b) -> Long.compare(a.getIndex(), b.getIndex()))
                .toList();
    }

    @Override
    public boolean verifyChain() {
        List<BlockchainBlock> blocks = getAllBlocks();

        if (blocks.isEmpty()) {
            return false;
        }

        BlockchainBlock genesis = blocks.get(0);

        if (genesis.getIndex() != 0
                || !GENESIS_PREVIOUS_HASH.equals(genesis.getPreviousHash())) {
            return false;
        }

        for (int i = 0; i < blocks.size(); i++) {
            BlockchainBlock current = blocks.get(i);

            if (current.getIndex() != i) {
                return false;
            }

            if (current.getHash() == null
                    || !current.getHash().equals(calculateHash(current))) {
                return false;
            }

            if (i > 0) {
                BlockchainBlock previous = blocks.get(i - 1);

                if (!previous.getHash().equals(current.getPreviousHash())) {
                    return false;
                }
            }
        }

        return true;
    }

    private String calculateHash(BlockchainBlock block) {
        try {
            String dataJson = objectMapper.writeValueAsString(block.getData());

            String rawData = block.getIndex()
                    + "|" + block.getTimestamp()
                    + "|" + block.getAction()
                    + "|" + dataJson
                    + "|" + block.getOperator()
                    + "|" + block.getRole()
                    + "|" + block.getPreviousHash();

            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hashBytes = digest.digest(
                    rawData.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hashBytes);

        } catch (NoSuchAlgorithmException | JsonProcessingException e) {
            throw new IllegalStateException("Không thể tạo mã băm SHA-256!", e);
        }
    }
}