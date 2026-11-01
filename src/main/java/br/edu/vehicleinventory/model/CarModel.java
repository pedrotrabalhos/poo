package br.edu.vehicleinventory.model;

import br.edu.vehicleinventory.brand.Brand;
import br.edu.vehicleinventory.shared.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "models")
public class CarModel extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @Column(nullable = false, length = 100)
    private String name;

    protected CarModel() {}

    public CarModel(Brand brand, String name) {
        update(brand, name);
    }

    public void update(Brand brand, String name) {
        this.brand = brand;
        this.name = name.strip();
    }

    public Brand getBrand() { return brand; }
    public String getName() { return name; }
}
