package br.edu.vehicleinventory.configuration;

import java.net.URI;
import br.edu.vehicleinventory.shared.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicle-configurations")
public class ConfigurationController {
    private final ConfigurationService service;

    public ConfigurationController(ConfigurationService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<ConfigurationResponse> list(@RequestParam(required = false) @Positive Long modelId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(modelId, PageRequest.of(page, size, Sort.by("id")));
    }

    @GetMapping("/{id}")
    public ConfigurationResponse get(@PathVariable @Positive long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<ConfigurationResponse> create(@Valid @RequestBody ConfigurationRequest request) {
        ConfigurationResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/vehicle-configurations/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public ConfigurationResponse update(@PathVariable @Positive long id, @Valid @RequestBody ConfigurationRequest request) {
        return service.update(id, request);
    }

    @GetMapping("/{id}/stock")
    public StockSummary stock(@PathVariable @Positive long id) {
        return service.stock(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
