const database = db.getSiblingDB("research_platform");
const experimentCount = database.experiments.countDocuments();
const runCount = database.experiment_runs.countDocuments();

if (experimentCount !== 0 || runCount !== 0) {
  print(`Demo seed skipped: found ${experimentCount} experiments and ${runCount} runs. Use reset-demo-data.js to replace them.`);
} else {
  const metrics = [
    { key: "estimate", label: "Pi estimate", unit: "", chartType: "line" },
    { key: "durationMillis", label: "Compute time", unit: "ms", chartType: "line" },
    { key: "samples", label: "Samples", unit: "count", chartType: "line" }
  ];

  const specs = [
    {
      name: "Monte Carlo π — convergence study",
      description: "Compare how the estimate of π changes as the number of random samples increases.",
      chartMetricKey: "estimate"
    },
    {
      name: "Monte Carlo π — runtime comparison",
      description: "Observe how the computation time grows with larger sample counts.",
      chartMetricKey: "durationMillis"
    },
    {
      name: "Monte Carlo π — high-volume runs",
      description: "A set of larger simulations for comparing estimate stability and runtime.",
      chartMetricKey: "samples"
    },
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

  const now = Date.now();
  const experiments = specs.map((spec) => ({
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
  const dayOffsets = [0, 1, 3, 8, 10, 15, 22, 29];
  const estimateOffsets = [0.22, -0.15, 0.09, -0.06, 0.035, -0.02, 0.012, -0.007];
  const runs = [];

  experiments.forEach((experiment, experimentIndex) => {
    sampleCounts.forEach((samples, index) => {
      const createdAt = new Date(now - dayOffsets[index] * 24 * 60 * 60 * 1000);
      createdAt.setHours(9 + ((index + experimentIndex * 3) % 9), (index * 7) % 60, 0, 0);
      const durationMillis = Math.round(80 + samples / 18000 + experimentIndex * 45);
      const estimate = Number((Math.PI + estimateOffsets[(index + experimentIndex * 2) % estimateOffsets.length] * Math.sqrt(10000 / samples)).toFixed(6));

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
  print(`Added ${experiments.length} demo experiments and ${runs.length} demo runs.`);
}
