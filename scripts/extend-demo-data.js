const database = db.getSiblingDB("research_platform");
const metrics = [
  { key: "estimate", label: "Pi estimate", unit: "", chartType: "line" },
  { key: "durationMillis", label: "Compute time", unit: "ms", chartType: "line" },
  { key: "samples", label: "Samples", unit: "count", chartType: "line" }
];

const specs = [
  {
    name: "Monte Carlo π — precision ladder",
    description: "Track how the estimate approaches π across progressively larger sample sizes.",
    chartMetricKey: "estimate"
  },
  {
    name: "Monte Carlo π — throughput profile",
    description: "Compare measured computation time for small, medium and large workloads.",
    chartMetricKey: "durationMillis"
  },
  {
    name: "Monte Carlo π — repeatability trials",
    description: "Review variation between repeated random trials at several sample counts.",
    chartMetricKey: "estimate"
  }
];

const existingNames = new Set(
  database.experiments.find({ name: { $in: specs.map((spec) => spec.name) } }, { name: 1 }).toArray().map((doc) => doc.name)
);
const missingSpecs = specs.filter((spec) => !existingNames.has(spec.name));

if (missingSpecs.length === 0) {
  print("All additional demo experiments are already present; nothing changed.");
} else {
  const now = Date.now();
  const experiments = missingSpecs.map((spec) => ({
    _id: new ObjectId(),
    name: spec.name,
    description: spec.description,
    type: "MONTE_CARLO_PI",
    chartMetricKey: spec.chartMetricKey,
    metrics,
    configuration: {},
    ownerId: "demo-data",
    publiclyVisible: true,
    publiclyEditable: false,
    createdAt: new Date(now - 35 * 24 * 60 * 60 * 1000)
  }));

  database.experiments.insertMany(experiments);

  const sampleCounts = [10000, 50000, 100000, 500000, 1000000, 5000000, 10000000, 50000000];
  const dayOffsets = [0, 2, 5, 8, 12, 16, 23, 30];
  const estimateOffsets = [0.22, -0.15, 0.09, -0.06, 0.035, -0.02, 0.012, -0.007];
  const runs = [];

  experiments.forEach((experiment, experimentIndex) => {
    sampleCounts.forEach((samples, index) => {
      const createdAt = new Date(now - dayOffsets[index] * 24 * 60 * 60 * 1000);
      createdAt.setHours(9 + ((index + experimentIndex * 4) % 9), (index * 11) % 60, 0, 0);
      const durationMillis = Math.round(95 + samples / 17500 + experimentIndex * 55);
      const estimate = Number((Math.PI + estimateOffsets[(index + experimentIndex * 3) % estimateOffsets.length] * Math.sqrt(10000 / samples)).toFixed(6));

      runs.push({
        experimentId: experiment._id.toHexString(),
        experimentName: experiment.name,
        calculation: "MONTE_CARLO_PI",
        status: "COMPLETED",
        samples,
        estimate,
        metricValues: { estimate, durationMillis, samples },
        durationMillis,
        createdAt,
        startedAt: createdAt,
        finishedAt: new Date(createdAt.getTime() + durationMillis)
      });
    });
  });

  database.experiment_runs.insertMany(runs);
  print(`Added ${experiments.length} additional demo experiments and ${runs.length} demo runs.`);
}
