
package com.bovsmart.jwt.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.bovsmart.jwt.model.DailyDiary;

@Repository
public interface DailyDiaryRepository extends MongoRepository<DailyDiary, String> {

    // Lấy tất cả nhật ký, sắp xếp ngày mới nhất trước
    List<DailyDiary> findAllByOrderByDateDesc();

    // Lấy nhật ký của một nhân viên
    List<DailyDiary> findByAuthorIdOrderByDateDesc(String authorId);

    // Lấy nhật ký theo ngày
    List<DailyDiary> findByDateOrderByCreatedAtDesc(LocalDate date);

    // Kiểm tra nhân viên đã ghi nhật ký theo ca trong ngày chưa
    boolean existsByAuthorIdAndDateAndShift(
            String authorId,
            LocalDate date,
            String shift
    );
}
