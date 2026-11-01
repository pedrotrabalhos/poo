package br.edu.vehicleinventory.brand;

public record BrandResponse(long id, String name) {
    public static BrandResponse from(Brand brand) {
        return new BrandResponse(brand.getId(), brand.getName());
    }
}
