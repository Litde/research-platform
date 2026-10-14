package pl.research.backend.exception;

public class ExperimentNotFoundException extends RuntimeException {

    public ExperimentNotFoundException(String id) {
        super("Experiment not found: " + id);
    }
}
