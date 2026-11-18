
package com.bovsmart.jwt.service;

import java.util.List;

import com.bovsmart.jwt.dto.request.DailyDiaryRequest;
import com.bovsmart.jwt.model.DailyDiary;

public interface DailyDiaryService {

    DailyDiary createDiary(
            DailyDiaryRequest request,
            String userId
    );

    List<DailyDiary> getAllDiaries();

    List<DailyDiary> getMyDiaries(String userId);

    DailyDiary getDiaryById(String diaryId);

    DailyDiary verifyDiary(
            String diaryId,
            String managerName
    );
}
