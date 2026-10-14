package pl.research.backend.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;

import pl.research.backend.experiment.Experiment;
import pl.research.backend.experiment.ExperimentRepository;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ExperimentMongoIntegrationTest {

    @Autowired
    private ExperimentRepository repository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Test
    void shouldSaveAndReadExperimentFromMongoDB() {
        // Arrange
        Experiment experiment = new Experiment(
                "Integration test experiment",
                "Experiment saved in real MongoDB"
        );

        // Act
        Experiment saved = repository.save(experiment);

        // Assert
        assertNotNull(saved.getId());

        Experiment found = repository.findById(saved.getId())
                .orElseThrow();

        assertEquals("Integration test experiment", found.getName());
        assertEquals(
                "Experiment saved in real MongoDB",
                found.getDescription()
        );

        // Cleanup
        repository.deleteById(saved.getId());
    }
}
