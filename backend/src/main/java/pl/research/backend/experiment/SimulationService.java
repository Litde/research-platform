package pl.research.backend.experiment;

import org.springframework.stereotype.Service;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import pl.research.backend.exception.ExperimentNotFoundException;

import java.util.List;

@Service
public class SimulationService {

    private final ExperimentService experiments;
    private final ExperimentRunRepository runs;
    private final RabbitTemplate rabbitTemplate;

    public SimulationService(ExperimentService experiments, ExperimentRunRepository runs, RabbitTemplate rabbitTemplate) {
        this.experiments = experiments;
        this.runs = runs;
        this.rabbitTemplate = rabbitTemplate;
    }

    public ExperimentRun run(String experimentId, SimulationRequest request, String userId, boolean admin) {
        Experiment experiment = experiments.findVisibleById(experimentId, userId, admin);

        ExperimentRun run = runs.save(new ExperimentRun(experimentId, experiment.getName(), request.samples()));
        rabbitTemplate.convertAndSend(RabbitConfiguration.EXCHANGE, RabbitConfiguration.ROUTING_KEY, run.getId());
        return run;
    }

    public List<ExperimentRun> findRuns(String experimentId, String userId, boolean admin) {
        experiments.findVisibleById(experimentId, userId, admin);
        return runs.findByExperimentIdOrderByCreatedAtDesc(experimentId);
    }

    public List<ExperimentRun> findActiveRuns(String userId, boolean admin) {
        return runs.findByStatusInOrderByCreatedAtAsc(List.of("QUEUED", "RUNNING")).stream()
                .filter(run -> canViewRun(run, userId, admin))
                .toList();
    }

    public List<ExperimentRun> findVisibleRuns(String userId, boolean admin) {
        return runs.findAllByOrderByCreatedAtDesc().stream()
                .filter(run -> canViewRun(run, userId, admin))
                .toList();
    }

    private boolean canViewRun(ExperimentRun run, String userId, boolean admin) {
        try {
            return experiments.canView(experiments.findById(run.getExperimentId()), userId, admin);
        } catch (ExperimentNotFoundException exception) {
            return false;
        }
    }

    public void deleteRuns(String experimentId) {
        runs.deleteByExperimentId(experimentId);
    }
}
