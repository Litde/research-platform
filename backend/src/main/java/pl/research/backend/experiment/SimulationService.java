package pl.research.backend.experiment;

import pl.research.backend.exception.ExperimentNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.List;

@Service
public class SimulationService {

    private final ExperimentRepository experiments;
    private final ExperimentRunRepository runs;
    private final RabbitTemplate rabbitTemplate;

    public SimulationService(ExperimentRepository experiments, ExperimentRunRepository runs, RabbitTemplate rabbitTemplate) {
        this.experiments = experiments;
        this.runs = runs;
        this.rabbitTemplate = rabbitTemplate;
    }

    public ExperimentRun run(String experimentId, SimulationRequest request) {
        Experiment experiment = experiments.findById(experimentId)
                .orElseThrow(() -> new ExperimentNotFoundException(experimentId));

        ExperimentRun run = runs.save(new ExperimentRun(experimentId, experiment.getName(), request.samples()));
        rabbitTemplate.convertAndSend(RabbitConfiguration.EXCHANGE, RabbitConfiguration.ROUTING_KEY, run.getId());
        return run;
    }

    public List<ExperimentRun> findRuns(String experimentId) {
        if (!experiments.existsById(experimentId)) {
            throw new ExperimentNotFoundException(experimentId);
        }
        return runs.findByExperimentIdOrderByCreatedAtDesc(experimentId);
    }

    public List<ExperimentRun> findActiveRuns() {
        return runs.findByStatusInOrderByCreatedAtAsc(List.of("QUEUED", "RUNNING"));
    }
}
