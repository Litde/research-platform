package pl.research.backend.experiment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

public record ExperimentRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 120, message = "Name cannot exceed 120 characters")
        String name,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        boolean publiclyVisible,
        boolean publiclyEditable,
        String type,
        List<MetricDefinition> metrics,
        Map<String, Object> configuration,
        String chartMetricKey
) {
    public ExperimentRequest(String name, String description) {
        this(name, description, false, false, null, null, null, null);
    }

    public ExperimentRequest(String name, String description, boolean publiclyVisible, boolean publiclyEditable) {
        this(name, description, publiclyVisible, publiclyEditable, null, null, null, null);
    }
}
