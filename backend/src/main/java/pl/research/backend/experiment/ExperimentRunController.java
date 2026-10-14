package pl.research.backend.experiment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/experiment-runs")
public class ExperimentRunController {
    private final SimulationService simulations;

    public ExperimentRunController(SimulationService simulations) {
        this.simulations = simulations;
    }

    @GetMapping("/active")
    public List<ExperimentRun> findActiveRuns() {
        return simulations.findActiveRuns();
    }
}
