
package com.bovsmart.jwt.service;

import com.bovsmart.jwt.dto.request.VaccinationRecordRequest;
import com.bovsmart.jwt.model.VaccinationRecord;
import com.bovsmart.jwt.security.services.UserDetailsImpl;

import java.util.List;

public interface VaccinationService {

    VaccinationRecord createVaccinationRecord(
        VaccinationRecordRequest request,
        UserDetailsImpl currentUser);

    List<VaccinationRecord> getAllVaccinationRecords();

    List<VaccinationRecord> getVaccinationRecordsByCattleId(String cattleId);

    VaccinationRecord getVaccinationRecordById(String id);

    List<VaccinationRecord> getUpcomingVaccinations();

    List<VaccinationRecord> getOverdueVaccinations();

    List<VaccinationRecord> getVaccinationsNeedingAttention();
}
