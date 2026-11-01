package br.edu.vehicleinventory.brand;

import java.net.URI;
import br.edu.vehicleinventory.shared.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/brands")
public class BrandController {
    private final BrandService service;

    public BrandController(BrandService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<BrandResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(PageRequest.of(page, size, Sort.by("id")));
    }

    @GetMapping("/{id}")
    public BrandResponse get(@PathVariable @Positive long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<BrandResponse> create(@Valid @RequestBody BrandRequest request) {
        BrandResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/brands/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public BrandResponse update(@PathVariable @Positive long id, @Valid @RequestBody BrandRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
