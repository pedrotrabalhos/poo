package br.edu.vehicleinventory.brand;

import br.edu.vehicleinventory.model.ModelRepository;
import br.edu.vehicleinventory.shared.ApiException;
import br.edu.vehicleinventory.shared.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BrandService {
    private final BrandRepository brands;
    private final ModelRepository models;

    public BrandService(BrandRepository brands, ModelRepository models) {
        this.brands = brands;
        this.models = models;
    }

    public PageResponse<BrandResponse> list(Pageable pageable) {
        return PageResponse.from(brands.findAll(pageable).map(BrandResponse::from));
    }

    public BrandResponse get(long id) {
        return BrandResponse.from(find(id));
    }

    @Transactional
    public BrandResponse create(BrandRequest request) {
        return BrandResponse.from(brands.saveAndFlush(new Brand(request.name())));
    }

    @Transactional
    public BrandResponse update(long id, BrandRequest request) {
        Brand brand = find(id);
        brand.rename(request.name());
        return BrandResponse.from(brands.saveAndFlush(brand));
    }

    @Transactional
    public void delete(long id) {
        Brand brand = find(id);
        if (models.existsByBrandId(id)) throw ApiException.conflict("Remove or reassign this brand's models first");
        brands.delete(brand);
        brands.flush();
    }

    private Brand find(long id) {
        return brands.findById(id).orElseThrow(() -> ApiException.notFound("Brand", id));
    }
}
