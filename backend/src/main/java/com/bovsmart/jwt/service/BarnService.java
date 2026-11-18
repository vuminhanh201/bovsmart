
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.BarnCleaningRequest;
import com.bovsmart.jwt.dto.request.CattleTransferRequest;
import com.bovsmart.jwt.model.Barn;
import com.bovsmart.jwt.model.BarnCapacityCheck;
import com.bovsmart.jwt.model.BarnCleaningLog;
import com.bovsmart.jwt.model.CattleTransfer;

import java.util.List;
import java.util.Optional;
import java.util.Map;


public interface BarnService {

    Barn createBarn(Barn barn);

    List<Barn> getAllBarns();

    Optional<Barn> getBarnById(String id);

    Barn updateBarn(String id, Barn barn);

    void deleteBarn(String id);

    Map<String, Object> checkCapacity(String code);

    BarnCapacityCheck confirmCapacityCheck(String code);    

    List<BarnCapacityCheck> getCapacityCheckHistory(String code);

    CattleTransfer transferCattle(String cattleId, CattleTransferRequest request);

    List<CattleTransfer> getCattleTransferHistory(String cattleId);

    BarnCleaningLog createCleaningLog(String barnCode, BarnCleaningRequest request);

    List<BarnCleaningLog> getCleaningHistory(String barnCode);
}
