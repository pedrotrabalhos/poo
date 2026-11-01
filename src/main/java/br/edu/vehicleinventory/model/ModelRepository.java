package br.edu.vehicleinventory.model;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModelRepository extends JpaRepository<CarModel, Long> {
    boolean existsByBrandId(long brandId);

    @Override
    @EntityGraph(attributePaths = "brand")
    Optional<CarModel> findById(Long id);

    @Override
    @EntityGraph(attributePaths = "brand")
    Page<CarModel> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "brand")
    Page<CarModel> findAllByBrandId(long brandId, Pageable pageable);
}
