package pl.research.backend.experiment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/experiment-runs")
public class ExperimentRunController {
    private final SimulationService simulations;

    public ExperimentRunController(SimulationService simulations) {
        this.simulations = simulations;
    }

    @GetMapping("/active")
    public List<ExperimentRun> findActiveRuns(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        String userId = jwt == null ? null : jwt.getSubject();
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).anyMatch("ROLE_ADMIN"::equals);
        return simulations.findActiveRuns(userId, admin);
    }

    @GetMapping("/history")
    public List<ExperimentRun> findVisibleHistory(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
        String userId = jwt == null ? null : jwt.getSubject();
        boolean admin = authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority).anyMatch("ROLE_ADMIN"::equals);
        return simulations.findVisibleRuns(userId, admin);
    }
}
