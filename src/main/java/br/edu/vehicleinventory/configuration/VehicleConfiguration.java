package br.edu.vehicleinventory.configuration;

import br.edu.vehicleinventory.model.CarModel;
import br.edu.vehicleinventory.shared.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "vehicle_configurations")
public class VehicleConfiguration extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "model_id", nullable = false)
    private CarModel model;

    @Column(nullable = false, length = 50)
    private String color;

    @Column(nullable = false, length = 100)
    private String specification;

    @Column(name = "vehicle_type", nullable = false, length = 50)
    private String vehicleType;

    protected VehicleConfiguration() {}

    public VehicleConfiguration(CarModel model, String color, String specification, String vehicleType) {
        update(model, color, specification, vehicleType);
    }

    public void update(CarModel model, String color, String specification, String vehicleType) {
        this.model = model;
        this.color = color.strip();
        this.specification = specification.strip();
        this.vehicleType = vehicleType.strip();
    }

    public CarModel getModel() { return model; }
    public String getColor() { return color; }
    public String getSpecification() { return specification; }
    public String getVehicleType() { return vehicleType; }
}
