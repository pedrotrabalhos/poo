package br.edu.vehicleinventory.vehicle;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {
    boolean existsByConfigurationId(long configurationId);

    @Override
    @EntityGraph(attributePaths = "configuration.model.brand")
    Optional<Vehicle> findById(Long id);

    @Override
    @EntityGraph(attributePaths = "configuration.model.brand")
    Page<Vehicle> findAll(Specification<Vehicle> specification, Pageable pageable);

    @Query("SELECT v.status AS status, COUNT(v) AS total FROM Vehicle v WHERE v.configuration.id = :configurationId GROUP BY v.status")
    List<StatusCount> countStock(@Param("configurationId") long configurationId);

    interface StatusCount {
        VehicleStatus getStatus();
        long getTotal();
    }
}
