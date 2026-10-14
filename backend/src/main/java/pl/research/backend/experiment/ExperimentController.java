package pl.research.backend.experiment;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/experiments")
public class ExperimentController {

    private final ExperimentService service;
    private final SimulationService simulationService;

    @Autowired
    public ExperimentController(ExperimentService service, SimulationService simulationService) {
        this.service = service;
        this.simulationService = simulationService;
    }

    public ExperimentController(ExperimentService service) {
        this(service, null);
    }

    @GetMapping
    public List<Experiment> findAll(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        if (jwt == null) return service.findAll(); // Supports the standalone MVC controller tests.
        return service.findVisibleTo(userId(jwt), isAdmin(authentication));
    }

    @PostMapping
    public Experiment create(
            @jakarta.validation.Valid
            @RequestBody ExperimentRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        if (jwt == null) return service.create(request);
        return service.create(request, userId(jwt));
    }

    @GetMapping("/{id}")
    public Experiment findById(@PathVariable String id, @AuthenticationPrincipal Jwt jwt,
                               Authentication authentication) {
        if (jwt == null) return service.findById(id);
        return service.findVisibleById(id, userId(jwt), isAdmin(authentication));
    }

    @PutMapping("/{id}")
    public Experiment update(
            @PathVariable String id,
            @jakarta.validation.Valid
            @RequestBody ExperimentRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        if (jwt == null) return service.update(id, request);
        return service.updateAuthorized(id, request, userId(jwt), isAdmin(authentication));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id, Authentication authentication) {
        if (authentication == null) {
            service.delete(id);
            return;
        }
        service.deleteAuthorized(id, isAdmin(authentication));
        simulationService.deleteRuns(id);
    }

    @PostMapping("/{id}/runs")
    public ExperimentRun runSimulation(
            @PathVariable String id,
            @jakarta.validation.Valid @RequestBody SimulationRequest request,
            @AuthenticationPrincipal Jwt jwt,
            Authentication authentication) {
        return simulationService.run(id, request, userId(jwt), isAdmin(authentication));
    }

    @GetMapping("/{id}/runs")
    public List<ExperimentRun> findRuns(@PathVariable String id, @AuthenticationPrincipal Jwt jwt,
                                        Authentication authentication) {
        return simulationService.findRuns(id, userId(jwt), isAdmin(authentication));
    }

    private String userId(Jwt jwt) { return jwt == null ? null : jwt.getSubject(); }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).anyMatch("ROLE_ADMIN"::equals);
    }

}
