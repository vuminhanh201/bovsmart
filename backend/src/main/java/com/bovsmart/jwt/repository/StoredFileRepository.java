
package com.bovsmart.jwt.repository;

import com.bovsmart.jwt.model.StoredFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoredFileRepository extends MongoRepository<StoredFile, String> {

    List<StoredFile> findByUploadedByAndDeletedFalseOrderByCreatedAtDesc(
            String uploadedBy
    );

    Optional<StoredFile> findByIdAndDeletedFalse(String id);

    // Tìm tệp theo ID và người sở hữu, chỉ lấy tệp chưa bị xóa
    Optional<StoredFile> findByIdAndUploadedByAndDeletedFalse(
            String id,
            String uploadedBy
    );
}
