package br.edu.vehicleinventory.model;

import jakarta.validation.constraints.*;

public record ModelRequest(@NotNull @Positive Long brandId, @NotBlank @Size(max = 100) String name) {}
