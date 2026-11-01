package br.edu.vehicleinventory.vehicle;

import java.net.URI;
import br.edu.vehicleinventory.shared.PageResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleService service;

    public VehicleController(VehicleService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<VehicleResponse> list(@Valid @ModelAttribute VehicleFilter filter,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return service.list(filter, PageRequest.of(page, size, Sort.by("id")));
    }

    @GetMapping("/{id}")
    public VehicleResponse get(@PathVariable @Positive long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        VehicleResponse response = service.create(request);
        return ResponseEntity.created(URI.create("/api/vehicles/" + response.id())).body(response);
    }

    @PutMapping("/{id}")
    public VehicleResponse update(@PathVariable @Positive long id, @Valid @RequestBody VehicleRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}")
    public VehicleResponse patch(@PathVariable @Positive long id, @Valid @RequestBody VehiclePatchRequest request) {
        return service.patch(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
