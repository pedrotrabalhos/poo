package br.edu.vehicleinventory.configuration;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfigurationRepository extends JpaRepository<VehicleConfiguration, Long> {
    boolean existsByModelId(long modelId);

    @Override
    @EntityGraph(attributePaths = "model.brand")
    Optional<VehicleConfiguration> findById(Long id);

    @Override
    @EntityGraph(attributePaths = "model.brand")
    Page<VehicleConfiguration> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "model.brand")
    Page<VehicleConfiguration> findAllByModelId(long modelId, Pageable pageable);
}
