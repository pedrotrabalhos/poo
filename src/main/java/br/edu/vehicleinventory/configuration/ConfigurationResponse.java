package br.edu.vehicleinventory.configuration;

import br.edu.vehicleinventory.model.ModelResponse;

public record ConfigurationResponse(long id, ModelResponse model, String color,
        String specification, String vehicleType) {
    public static ConfigurationResponse from(VehicleConfiguration configuration) {
        return new ConfigurationResponse(configuration.getId(), ModelResponse.from(configuration.getModel()),
                configuration.getColor(), configuration.getSpecification(), configuration.getVehicleType());
    }
}
