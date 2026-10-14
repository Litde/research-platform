package pl.research.backend;

import pl.research.backend.experiment.Experiment;
import pl.research.backend.experiment.ExperimentController;
import pl.research.backend.experiment.ExperimentService;
import pl.research.backend.experiment.ExperimentRequest;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;

import org.junit.jupiter.api.BeforeEach;

@ExtendWith(MockitoExtension.class)
class ExperimentControllerTest {

    @Mock
    private ExperimentService service;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ExperimentController controller =
                new ExperimentController(service);

        mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .build();
    }

    @Test
    void shouldReturnAllExperiments() throws Exception {
        // Arrange
        Experiment experiment =
                new Experiment("Test experiment", "Test description");

        when(service.findAll())
                .thenReturn(List.of(experiment));

        // Act + Assert
        mockMvc.perform(get("/api/experiments"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(
                        MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].name")
                        .value("Test experiment"))
                .andExpect(jsonPath("$[0].description")
                        .value("Test description"));
    }

    @Test
    void shouldCreateExperiment() throws Exception {
        Experiment experiment =
                new Experiment("New experiment", "Description");

        when(service.create(any(ExperimentRequest.class)))
                .thenReturn(experiment);

        mockMvc.perform(post("/api/experiments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "name": "New experiment",
                              "description": "Description"
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New experiment"))
                .andExpect(jsonPath("$.description").value("Description"));
    }

    @Test
    void shouldRejectExperimentWithBlankName() throws Exception {
        mockMvc.perform(post("/api/experiments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {
                              "name": "",
                              "description": "Description"
                            }
                            """))
                .andExpect(status().isBadRequest());
    }


    @Test
    void shouldUpdateExperiment() throws Exception {
        Experiment experiment =
                new Experiment("Updated experiment", "Updated description");

        when(service.update(
                org.mockito.ArgumentMatchers.eq("123"),
                any(ExperimentRequest.class)
        )).thenReturn(experiment);

        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .put("/api/experiments/123")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("""
                            {
                              "name": "Updated experiment",
                              "description": "Updated description"
                            }
                            """)
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated experiment"))
                .andExpect(jsonPath("$.description").value("Updated description"));
    }


    @Test
    void shouldDeleteExperiment() throws Exception {
        mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .delete("/api/experiments/123")
                )
                .andExpect(status().isOk());

        verify(service).delete("123");
    }

}
