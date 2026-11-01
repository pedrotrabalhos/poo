package br.edu.vehicleinventory.vehicle;

import java.util.ArrayList;
import java.util.List;
import br.edu.vehicleinventory.configuration.VehicleConfiguration;
import br.edu.vehicleinventory.model.CarModel;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public final class VehicleSpecifications {
    private VehicleSpecifications() {}

    public static Specification<Vehicle> matching(VehicleFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            Join<Vehicle, VehicleConfiguration> configuration = root.join("configuration");
            Join<VehicleConfiguration, CarModel> model = configuration.join("model");
            if (filter.brandId() != null) predicates.add(builder.equal(model.get("brand").get("id"), filter.brandId()));
            if (filter.modelId() != null) predicates.add(builder.equal(model.get("id"), filter.modelId()));
            if (filter.configurationId() != null) predicates.add(builder.equal(configuration.get("id"), filter.configurationId()));
            if (filter.minPrice() != null) predicates.add(builder.greaterThanOrEqualTo(root.get("price"), filter.minPrice()));
            if (filter.maxPrice() != null) predicates.add(builder.lessThanOrEqualTo(root.get("price"), filter.maxPrice()));
            if (filter.year() != null) predicates.add(builder.equal(root.get("manufactureYear"), filter.year()));
            if (filter.status() != null) predicates.add(builder.equal(root.get("status"), filter.status()));
            if (filter.color() != null) predicates.add(builder.equal(builder.lower(configuration.get("color")), filter.color().strip().toLowerCase(java.util.Locale.ROOT)));
            if (filter.specification() != null) predicates.add(builder.equal(builder.lower(configuration.get("specification")), filter.specification().strip().toLowerCase(java.util.Locale.ROOT)));
            if (filter.vehicleType() != null) predicates.add(builder.equal(builder.lower(configuration.get("vehicleType")), filter.vehicleType().strip().toLowerCase(java.util.Locale.ROOT)));
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
