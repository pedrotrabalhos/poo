package br.edu.vehicleinventory.model;

import br.edu.vehicleinventory.brand.BrandResponse;

public record ModelResponse(long id, String name, BrandResponse brand) {
    public static ModelResponse from(CarModel model) {
        return new ModelResponse(model.getId(), model.getName(), BrandResponse.from(model.getBrand()));
    }
}
