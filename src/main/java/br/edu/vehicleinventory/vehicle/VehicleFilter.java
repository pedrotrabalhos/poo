package br.edu.vehicleinventory.vehicle;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

public record VehicleFilter(
        @Positive Long brandId,
        @Positive Long modelId,
        @Positive Long configurationId,
        @PositiveOrZero @Digits(integer = 12, fraction = 2) BigDecimal minPrice,
        @PositiveOrZero @Digits(integer = 12, fraction = 2) BigDecimal maxPrice,
        @Min(1886) @Max(9999) Integer year,
        VehicleStatus status,
        @Size(max = 50) String color,
        @Size(max = 100) String specification,
        @Size(max = 50) String vehicleType) {
    @AssertTrue(message = "minPrice must be less than or equal to maxPrice")
    public boolean isPriceRangeValid() {
        return minPrice == null || maxPrice == null || minPrice.compareTo(maxPrice) <= 0;
    }
}
