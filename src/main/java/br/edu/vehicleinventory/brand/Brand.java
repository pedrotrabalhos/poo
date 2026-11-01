package br.edu.vehicleinventory.brand;

import br.edu.vehicleinventory.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "brands")
public class Brand extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String name;

    protected Brand() {}

    public Brand(String name) {
        rename(name);
    }

    public void rename(String name) {
        this.name = name.strip();
    }

    public String getName() { return name; }
}
