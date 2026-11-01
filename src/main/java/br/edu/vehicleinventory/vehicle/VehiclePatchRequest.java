package br.edu.vehicleinventory.vehicle;

import java.math.BigDecimal;
import jakarta.validation.constraints.*;

public record VehiclePatchRequest(
        @PositiveOrZero @Digits(integer = 12, fraction = 2) BigDecimal price,
        @PositiveOrZero Long mileage,
        VehicleStatus status) {}
