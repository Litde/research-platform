package pl.research.backend.experiment;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExperimentRunRepository extends MongoRepository<ExperimentRun, String> {
    List<ExperimentRun> findByExperimentIdOrderByCreatedAtDesc(String experimentId);
    List<ExperimentRun> findByStatusInOrderByCreatedAtAsc(List<String> statuses);
    List<ExperimentRun> findAllByOrderByCreatedAtDesc();
    void deleteByExperimentId(String experimentId);
}
