package pl.research.backend.experiment;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.util.SplittableRandom;

@Component
public class SimulationWorker {
    private final ExperimentRunRepository runs;
    private final long demoDelayMillis;

    public SimulationWorker(
            ExperimentRunRepository runs,
            @Value("${research.simulation.demo-delay-ms:10000}") long demoDelayMillis) {
        this.runs = runs;
        this.demoDelayMillis = Math.max(0, demoDelayMillis);
    }

    @RabbitListener(queues = RabbitConfiguration.QUEUE)
    public void process(String runId) {
        ExperimentRun run = runs.findById(runId).orElse(null);
        if (run == null || "COMPLETED".equals(run.getStatus())) {
            return;
        }

        run.markRunning();
        runs.save(run);

        try {
            Thread.sleep(demoDelayMillis);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            run.fail("Simulation was interrupted while waiting for the demo delay.");
            runs.save(run);
            return;
        }

        long startedAt = System.nanoTime();
        SplittableRandom random = new SplittableRandom();
        long pointsInsideCircle = 0;

        try {
            for (long i = 0; i < run.getSamples(); i++) {
                double x = random.nextDouble(-1.0, 1.0);
                double y = random.nextDouble(-1.0, 1.0);
                if (x * x + y * y <= 1.0) {
                    pointsInsideCircle++;
                }
            }

            double estimate = 4.0 * pointsInsideCircle / run.getSamples();
            long durationMillis = (System.nanoTime() - startedAt) / 1_000_000;
            run.complete(estimate, durationMillis);
        } catch (RuntimeException exception) {
            run.fail("Simulation failed: " + exception.getMessage());
        }
        runs.save(run);
    }
}
