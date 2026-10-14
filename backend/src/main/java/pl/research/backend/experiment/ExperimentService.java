package pl.research.backend.experiment;

import pl.research.backend.exception.ExperimentNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ExperimentService {

    private final ExperimentRepository repository;

    public ExperimentService(ExperimentRepository repository) {
        this.repository = repository;
    }

    public List<Experiment> findAll() {
        return repository.findAll();
    }

    public List<Experiment> findVisibleTo(String userId, boolean admin) {
        return repository.findAll().stream()
                .filter(experiment -> canView(experiment, userId, admin))
                .toList();
    }

    public Experiment create(ExperimentRequest request) {
        return create(request, null);
    }

    public Experiment create(ExperimentRequest request, String ownerId) {
        validateVisibility(request);
        Experiment experiment = new Experiment(
                request.name(),
                request.description(),
                ownerId,
                request.publiclyVisible(),
                request.publiclyEditable()
        );
        applyDefinition(experiment, request);

        return repository.save(experiment);
    }

    public Experiment findById(String id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new ExperimentNotFoundException(id));
    }

    public Experiment findVisibleById(String id, String userId, boolean admin) {
        Experiment experiment = findById(id);
        if (!canView(experiment, userId, admin)) {
            throw new ExperimentNotFoundException(id);
        }
        return experiment;
    }

    public Experiment update(
            String id,
            ExperimentRequest request) {

        Experiment experiment = findById(id);
        experiment.setName(request.name());
        experiment.setDescription(request.description());
        experiment.setPubliclyVisible(request.publiclyVisible());
        experiment.setPubliclyEditable(request.publiclyEditable());
        applyDefinition(experiment, request);

        return repository.save(experiment);
    }

    public Experiment updateAuthorized(String id, ExperimentRequest request,
                                       String userId, boolean admin) {
        Experiment experiment = findById(id);
        boolean owner = userId != null && userId.equals(experiment.getOwnerId());
        boolean publicEditor = experiment.isPubliclyVisible() && experiment.isPubliclyEditable();
        if (!admin && !owner && !publicEditor) {
            throw new AccessDeniedException("You cannot edit this experiment");
        }

        validateVisibility(request);
        experiment.setName(request.name());
        experiment.setDescription(request.description());
        if (admin || owner) {
            experiment.setPubliclyVisible(request.publiclyVisible());
            experiment.setPubliclyEditable(request.publiclyEditable());
            applyDefinition(experiment, request);
        }
        return repository.save(experiment);
    }

    public void delete(String id) {
        Experiment experiment = findById(id);
        repository.delete(experiment);
    }

    public void deleteAuthorized(String id, boolean admin) {
        if (!admin) {
            throw new AccessDeniedException("Only administrators can delete experiments");
        }
        delete(id);
    }

    public boolean canView(Experiment experiment, String userId, boolean admin) {
        return admin
                || (userId != null && userId.equals(experiment.getOwnerId()))
                || experiment.isPubliclyVisible();
    }

    private void validateVisibility(ExperimentRequest request) {
        if (request.publiclyEditable() && !request.publiclyVisible()) {
            throw new IllegalArgumentException("An experiment must be public to allow public editing");
        }
    }

    private void applyDefinition(Experiment experiment, ExperimentRequest request) {
        if (request.type() != null && !request.type().isBlank()) experiment.setType(request.type());
        if (request.metrics() != null) experiment.setMetrics(request.metrics());
        if (request.configuration() != null) experiment.setConfiguration(request.configuration());
        if (request.chartMetricKey() != null && !request.chartMetricKey().isBlank()) {
            boolean knownMetric = experiment.getMetrics().stream()
                    .anyMatch(metric -> metric.key().equals(request.chartMetricKey()));
            if (!knownMetric) throw new IllegalArgumentException("The selected chart metric is not defined for this experiment");
            experiment.setChartMetricKey(request.chartMetricKey());
        }
    }

}
