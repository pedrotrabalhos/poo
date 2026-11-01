package br.edu.vehicleinventory.configuration;

import jakarta.validation.constraints.*;

public record ConfigurationRequest(
        @NotNull @Positive Long modelId,
        @NotBlank @Size(max = 50) String color,
        @NotBlank @Size(max = 100) String specification,
        @NotBlank @Size(max = 50) String vehicleType) {}
