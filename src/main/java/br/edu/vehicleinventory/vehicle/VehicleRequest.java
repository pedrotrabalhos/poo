package br.edu.vehicleinventory.vehicle;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

public record VehicleRequest(
        @NotNull @Positive Long configurationId,
        @NotBlank @Size(max = 64) String stockCode,
        @NotNull @Min(1886) @Max(9999) Integer manufactureYear,
        @NotNull @PositiveOrZero @Digits(integer = 12, fraction = 2) BigDecimal price,
        @NotNull @PositiveOrZero Long mileage,
        @NotNull VehicleStatus status) {}
