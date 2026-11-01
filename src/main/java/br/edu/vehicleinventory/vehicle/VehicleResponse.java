package br.edu.vehicleinventory.vehicle;

import java.math.BigDecimal;
import br.edu.vehicleinventory.configuration.ConfigurationResponse;

public record VehicleResponse(long id, String stockCode, ConfigurationResponse configuration,
        int manufactureYear, BigDecimal price, long mileage, VehicleStatus status) {
    public static VehicleResponse from(Vehicle vehicle) {
        return new VehicleResponse(vehicle.getId(), vehicle.getStockCode(),
                ConfigurationResponse.from(vehicle.getConfiguration()), vehicle.getManufactureYear(),
                vehicle.getPrice(), vehicle.getMileage(), vehicle.getStatus());
    }
}
