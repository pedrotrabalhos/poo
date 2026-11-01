package br.edu.vehicleinventory.model;

import br.edu.vehicleinventory.brand.Brand;
import br.edu.vehicleinventory.brand.BrandRepository;
import br.edu.vehicleinventory.configuration.ConfigurationRepository;
import br.edu.vehicleinventory.shared.ApiException;
import br.edu.vehicleinventory.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ModelService {
    private final ModelRepository models;
    private final BrandRepository brands;
    private final ConfigurationRepository configurations;

    public ModelService(ModelRepository models, BrandRepository brands, ConfigurationRepository configurations) {
        this.models = models;
        this.brands = brands;
        this.configurations = configurations;
    }

    public PageResponse<ModelResponse> list(Long brandId, Pageable pageable) {
        var result = brandId == null ? models.findAll(pageable) : models.findAllByBrandId(brandId, pageable);
        return PageResponse.from(result.map(ModelResponse::from));
    }

    public ModelResponse get(long id) {
        return ModelResponse.from(find(id));
    }

    @Transactional
    public ModelResponse create(ModelRequest request) {
        return ModelResponse.from(models.saveAndFlush(new CarModel(findBrand(request.brandId()), request.name())));
    }

    @Transactional
    public ModelResponse update(long id, ModelRequest request) {
        CarModel model = find(id);
        model.update(findBrand(request.brandId()), request.name());
        return ModelResponse.from(models.saveAndFlush(model));
    }

    @Transactional
    public void delete(long id) {
        CarModel model = find(id);
        if (configurations.existsByModelId(id)) throw ApiException.conflict("Remove or reassign this model's configurations first");
        models.delete(model);
        models.flush();
    }

    private CarModel find(long id) {
        return models.findById(id).orElseThrow(() -> ApiException.notFound("Model", id));
    }

    private Brand findBrand(long id) {
        return brands.findById(id).orElseThrow(() -> ApiException.notFound("Brand", id));
    }
}
