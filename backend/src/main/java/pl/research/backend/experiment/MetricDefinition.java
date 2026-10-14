package pl.research.backend.experiment;

/** Describes one numeric result that an experiment can produce. */
public record MetricDefinition(String key, String label, String unit, String chartType) {
}
