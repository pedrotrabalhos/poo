package br.edu.vehicleinventory.configuration;

import java.util.EnumMap;
import br.edu.vehicleinventory.model.CarModel;
import br.edu.vehicleinventory.model.ModelRepository;
import br.edu.vehicleinventory.shared.ApiException;
import br.edu.vehicleinventory.shared.PageResponse;
import br.edu.vehicleinventory.vehicle.VehicleRepository;
import br.edu.vehicleinventory.vehicle.VehicleStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ConfigurationService {
    private final ConfigurationRepository configurations;
    private final ModelRepository models;
    private final VehicleRepository vehicles;

    public ConfigurationService(ConfigurationRepository configurations, ModelRepository models, VehicleRepository vehicles) {
        this.configurations = configurations;
        this.models = models;
        this.vehicles = vehicles;
    }

    public PageResponse<ConfigurationResponse> list(Long modelId, Pageable pageable) {
        var result = modelId == null ? configurations.findAll(pageable) : configurations.findAllByModelId(modelId, pageable);
        return PageResponse.from(result.map(ConfigurationResponse::from));
    }

    public ConfigurationResponse get(long id) {
        return ConfigurationResponse.from(find(id));
    }

    public StockSummary stock(long id) {
        find(id);
        var counts = new EnumMap<VehicleStatus, Long>(VehicleStatus.class);
        vehicles.countStock(id).forEach(count -> counts.put(count.getStatus(), count.getTotal()));
        long available = counts.getOrDefault(VehicleStatus.AVAILABLE, 0L);
        long sold = counts.getOrDefault(VehicleStatus.SOLD, 0L);
        long discontinued = counts.getOrDefault(VehicleStatus.DISCONTINUED, 0L);
        return new StockSummary(id, available + sold + discontinued, available, sold, discontinued);
    }

    @Transactional
    public ConfigurationResponse create(ConfigurationRequest request) {
        var configuration = new VehicleConfiguration(findModel(request.modelId()), request.color(),
                request.specification(), request.vehicleType());
        return ConfigurationResponse.from(configurations.saveAndFlush(configuration));
    }

    @Transactional
    public ConfigurationResponse update(long id, ConfigurationRequest request) {
        VehicleConfiguration configuration = find(id);
        configuration.update(findModel(request.modelId()), request.color(), request.specification(), request.vehicleType());
        return ConfigurationResponse.from(configurations.saveAndFlush(configuration));
    }

    @Transactional
    public void delete(long id) {
        VehicleConfiguration configuration = find(id);
        if (vehicles.existsByConfigurationId(id)) throw ApiException.conflict("Remove or reassign this configuration's stock units first");
        configurations.delete(configuration);
        configurations.flush();
    }

    private VehicleConfiguration find(long id) {
        return configurations.findById(id).orElseThrow(() -> ApiException.notFound("Configuration", id));
    }

    private CarModel findModel(long id) {
        return models.findById(id).orElseThrow(() -> ApiException.notFound("Model", id));
    }
}
