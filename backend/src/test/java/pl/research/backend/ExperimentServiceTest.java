package pl.research.backend;

import pl.research.backend.experiment.Experiment;
import pl.research.backend.experiment.ExperimentRepository;
import pl.research.backend.experiment.ExperimentRequest;
import pl.research.backend.experiment.ExperimentService;
import pl.research.backend.exception.ExperimentNotFoundException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExperimentServiceTest {

    @Mock
    private ExperimentRepository repository;

    @InjectMocks
    private ExperimentService service;

    @Test
    void shouldCreateExperiment() {
        var request = new ExperimentRequest(
                "Test experiment",
                "Test description"
        );

        when(repository.save(any(Experiment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Experiment result = service.create(request);

        assertEquals("Test experiment", result.getName());
        assertEquals("Test description", result.getDescription());
        assertNotNull(result.getCreatedAt());

        verify(repository).save(any(Experiment.class));
    }

    @Test
    void shouldFindExperimentById() {
        var experiment = new Experiment(
                "Test experiment",
                "Test description"
        );

        when(repository.findById("123"))
                .thenReturn(Optional.of(experiment));

        Experiment result = service.findById("123");

        assertEquals("Test experiment", result.getName());
        verify(repository).findById("123");
    }
}
