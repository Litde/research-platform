package pl.research.backend.experiment;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface ExperimentRepository extends MongoRepository<Experiment, String> {
}
