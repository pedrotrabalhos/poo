package br.edu.vehicleinventory.vehicle;

import br.edu.vehicleinventory.configuration.ConfigurationRepository;
import br.edu.vehicleinventory.configuration.VehicleConfiguration;
import br.edu.vehicleinventory.shared.ApiException;
import br.edu.vehicleinventory.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class VehicleService {
    private final VehicleRepository vehicles;
    private final ConfigurationRepository configurations;

    public VehicleService(VehicleRepository vehicles, ConfigurationRepository configurations) {
        this.vehicles = vehicles;
        this.configurations = configurations;
    }

    public PageResponse<VehicleResponse> list(VehicleFilter filter, Pageable pageable) {
        return PageResponse.from(vehicles.findAll(VehicleSpecifications.matching(filter), pageable).map(VehicleResponse::from));
    }

    public VehicleResponse get(long id) {
        return VehicleResponse.from(find(id));
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        Vehicle vehicle = new Vehicle(findConfiguration(request.configurationId()), request.stockCode(),
                request.manufactureYear(), request.price(), request.mileage(), request.status());
        return VehicleResponse.from(vehicles.saveAndFlush(vehicle));
    }

    @Transactional
    public VehicleResponse update(long id, VehicleRequest request) {
        Vehicle vehicle = find(id);
        vehicle.update(findConfiguration(request.configurationId()), request.stockCode(), request.manufactureYear(),
                request.price(), request.mileage(), request.status());
        return VehicleResponse.from(vehicles.saveAndFlush(vehicle));
    }

    @Transactional
    public VehicleResponse patch(long id, VehiclePatchRequest request) {
        Vehicle vehicle = find(id);
        if (request.price() == null && request.mileage() == null && request.status() == null) {
            throw ApiException.badRequest("Provide at least one of price, mileage or status");
        }
        vehicle.reviseTerms(request.price(), request.mileage(), request.status());
        return VehicleResponse.from(vehicles.saveAndFlush(vehicle));
    }

    @Transactional
    public void delete(long id) {
        Vehicle vehicle = find(id);
        vehicle.ensureRemovable();
        vehicles.delete(vehicle);
        vehicles.flush();
    }

    private Vehicle find(long id) {
        return vehicles.findById(id).orElseThrow(() -> ApiException.notFound("Vehicle", id));
    }

    private VehicleConfiguration findConfiguration(long id) {
        return configurations.findById(id).orElseThrow(() -> ApiException.notFound("Configuration", id));
    }
}
