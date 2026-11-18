
package com.bovsmart.jwt.service;

import java.util.List;

import com.bovsmart.jwt.dto.request.VaccinationScheduleRequest;
import com.bovsmart.jwt.model.VaccinationSchedule;
import com.bovsmart.jwt.security.services.UserDetailsImpl;

public interface VaccinationScheduleService {

    VaccinationSchedule createSchedule(
            VaccinationScheduleRequest request,
            UserDetailsImpl currentUser);

    List<VaccinationSchedule> getAllSchedules();

    List<VaccinationSchedule> getSchedulesAssignedToVeterinarian(
            UserDetailsImpl currentUser);

    VaccinationSchedule getScheduleById(String id);

    VaccinationSchedule updateScheduleStatus(
            String id,
            String status,
            UserDetailsImpl currentUser);
}
