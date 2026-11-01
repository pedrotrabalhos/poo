package br.edu.vehicleinventory.vehicle;

import java.math.BigDecimal;
import java.util.Locale;
import br.edu.vehicleinventory.configuration.VehicleConfiguration;
import br.edu.vehicleinventory.shared.ApiException;
import br.edu.vehicleinventory.shared.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "vehicles")
public class Vehicle extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "configuration_id", nullable = false)
    private VehicleConfiguration configuration;

    @Column(name = "stock_code", nullable = false, length = 64)
    private String stockCode;

    @Column(name = "manufacture_year", nullable = false)
    private int manufactureYear;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private long mileage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus status;

    protected Vehicle() {}

    public Vehicle(VehicleConfiguration configuration, String stockCode, int manufactureYear,
            BigDecimal price, long mileage, VehicleStatus status) {
        update(configuration, stockCode, manufactureYear, price, mileage, status);
    }

    public void update(VehicleConfiguration configuration, String stockCode, int manufactureYear,
            BigDecimal price, long mileage, VehicleStatus status) {
        this.configuration = configuration;
        this.stockCode = stockCode.strip().toUpperCase(Locale.ROOT);
        this.manufactureYear = manufactureYear;
        reviseTerms(price, mileage, status);
    }

    public void reviseTerms(BigDecimal price, Long mileage, VehicleStatus status) {
        if (price != null) this.price = price;
        if (mileage != null) this.mileage = mileage;
        if (status != null) this.status = status;
    }

    public void ensureRemovable() {
        if (status == VehicleStatus.AVAILABLE) {
            throw ApiException.conflict("Mark the vehicle SOLD or DISCONTINUED before removing it from stock");
        }
    }

    public VehicleConfiguration getConfiguration() { return configuration; }
    public String getStockCode() { return stockCode; }
    public int getManufactureYear() { return manufactureYear; }
    public BigDecimal getPrice() { return price; }
    public long getMileage() { return mileage; }
    public VehicleStatus getStatus() { return status; }
}
