package pl.research.backend.experiment;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "experiment_runs")
public class ExperimentRun {

    @Id
    private String id;
    private String experimentId;
    private String experimentName;
    private String calculation;
    private String status;
    private long samples;
    private Double estimate;
    private long durationMillis;
    private Instant createdAt;
    private Instant startedAt;
    private Instant finishedAt;
    private String error;

    public ExperimentRun() {
    }

    public ExperimentRun(String experimentId, String experimentName, long samples) {
        this.experimentId = experimentId;
        this.experimentName = experimentName;
        this.calculation = "MONTE_CARLO_PI";
        this.samples = samples;
        this.status = "QUEUED";
        this.createdAt = Instant.now();
    }

    public void markRunning() {
        this.status = "RUNNING";
        this.startedAt = Instant.now();
    }

    public void complete(double estimate, long durationMillis) {
        this.status = "COMPLETED";
        this.estimate = estimate;
        this.durationMillis = durationMillis;
        this.finishedAt = Instant.now();
    }

    public void fail(String error) {
        this.status = "FAILED";
        this.error = error;
        this.finishedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getExperimentId() { return experimentId; }
    public String getExperimentName() { return experimentName; }
    public String getCalculation() { return calculation; }
    public String getStatus() { return status; }
    public long getSamples() { return samples; }
    public Double getEstimate() { return estimate; }
    public long getDurationMillis() { return durationMillis; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getStartedAt() { return startedAt; }
    public Instant getFinishedAt() { return finishedAt; }
    public String getError() { return error; }
}
