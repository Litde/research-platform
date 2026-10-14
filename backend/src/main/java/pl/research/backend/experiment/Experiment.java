package pl.research.backend.experiment;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "experiments")
public class Experiment {

    @Id
    private String id;

    private String name;
    private String description;
    private String type = "MONTE_CARLO_PI";
    private String chartMetricKey = "estimate";
    private List<MetricDefinition> metrics = List.of(
            new MetricDefinition("estimate", "Pi estimate", "", "line"),
            new MetricDefinition("durationMillis", "Compute time", "ms", "line"),
            new MetricDefinition("samples", "Samples", "count", "line")
    );
    private Map<String, Object> configuration = Map.of();
    private String ownerId;
    // Keep pre-sharing experiments visible after upgrading existing MongoDB documents.
    private boolean publiclyVisible = true;
    private boolean publiclyEditable;
    private Instant createdAt;

    public Experiment() {
    }

    public Experiment(String name, String description) {
        this(name, description, null, false, false);
    }

    public Experiment(String name, String description, String ownerId,
                      boolean publiclyVisible, boolean publiclyEditable) {
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.publiclyVisible = publiclyVisible;
        this.publiclyEditable = publiclyEditable;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getType() { return type == null ? "MONTE_CARLO_PI" : type; }

    public String getChartMetricKey() { return chartMetricKey == null ? "estimate" : chartMetricKey; }

    public List<MetricDefinition> getMetrics() { return metrics == null ? List.of() : metrics; }

    public Map<String, Object> getConfiguration() { return configuration == null ? Map.of() : configuration; }

    public String getOwnerId() { return ownerId; }

    public boolean isPubliclyVisible() { return publiclyVisible; }

    public boolean isPubliclyEditable() { return publiclyEditable; }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setType(String type) { this.type = type; }

    public void setChartMetricKey(String chartMetricKey) { this.chartMetricKey = chartMetricKey; }

    public void setMetrics(List<MetricDefinition> metrics) { this.metrics = metrics; }

    public void setConfiguration(Map<String, Object> configuration) { this.configuration = configuration; }

    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public void setPubliclyVisible(boolean publiclyVisible) { this.publiclyVisible = publiclyVisible; }

    public void setPubliclyEditable(boolean publiclyEditable) { this.publiclyEditable = publiclyEditable; }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
