package pl.research.backend.experiment;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

    private final ExperimentService service;

    public ExperimentController(ExperimentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Experiment> findAll() {
        return service.findAll();
    }

    @PostMapping
    public Experiment create(
            @jakarta.validation.Valid
            @RequestBody ExperimentRequest request
    ) {
        return service.create(request);
    }

    @GetMapping("/{id}")
    public Experiment findById(@PathVariable String id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    public Experiment update(
            @PathVariable String id,
            @jakarta.validation.Valid
            @RequestBody ExperimentRequest request) {

        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        service.delete(id);
    }

}
