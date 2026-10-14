package pl.research.backend.experiment;

import pl.research.backend.exception.ExperimentNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExperimentService {

    private final ExperimentRepository repository;

    public ExperimentService(ExperimentRepository repository) {
        this.repository = repository;
    }

    public List<Experiment> findAll() {
        return repository.findAll();
    }

    public Experiment create(ExperimentRequest request) {
        Experiment experiment = new Experiment(
                request.name(),
                request.description()
        );

        return repository.save(experiment);
    }

    public Experiment findById(String id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new ExperimentNotFoundException(id));
    }

    public Experiment update(
            String id,
            ExperimentRequest request) {

        Experiment experiment = findById(id);
        experiment.setName(request.name());
        experiment.setDescription(request.description());

        return repository.save(experiment);
    }

    public void delete(String id) {
        Experiment experiment = findById(id);
        repository.delete(experiment);
    }

}
