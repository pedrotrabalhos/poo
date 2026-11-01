package br.edu.vehicleinventory.model;

import java.net.URI;
import br.edu.vehicleinventory.shared.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/models")
public class ModelController {
    private final ModelService service;

    public ModelController(ModelService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<ModelResponse> list(@RequestParam(required = false) @Positive Long brandId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(brandId, PageRequest.of(page, size, Sort.by("id")));
    }

    @GetMapping("/{id}")
    public ModelResponse get(@PathVariable @Positive long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<ModelResponse> create(@Valid @RequestBody ModelRequest request) {
        ModelResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/models/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ModelResponse update(@PathVariable @Positive long id, @Valid @RequestBody ModelRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
