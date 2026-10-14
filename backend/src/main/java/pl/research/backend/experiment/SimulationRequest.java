package pl.research.backend.experiment;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SimulationRequest(
        @Min(value = 1_000, message = "At least 1,000 samples are required")
        @Max(value = 500_000_000, message = "At most 500,000,000 samples are allowed")
        long samples
) {
}
