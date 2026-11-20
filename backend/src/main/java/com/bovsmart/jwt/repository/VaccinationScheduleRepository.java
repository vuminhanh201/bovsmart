
package com.bovsmart.jwt.repository;

import java.util.List;

import java.util.Collection;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bovsmart.jwt.model.VaccinationSchedule;

public interface VaccinationScheduleRepository
        extends MongoRepository<VaccinationSchedule, String> {

    List<VaccinationSchedule> findByAssignedVeterinarianEmailOrderByScheduledDateAsc(
            String assignedVeterinarianEmail);

    List<VaccinationSchedule> findByStatusOrderByScheduledDateAsc(
            String status);

    List<VaccinationSchedule> findAllByOrderByScheduledDateAsc();

    List<VaccinationSchedule> findByCattleIdsInOrderByScheduledDateAsc(
                Collection<String> cattleIds
    );

}
