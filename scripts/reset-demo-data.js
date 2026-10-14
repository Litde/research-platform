const database = db.getSiblingDB("research_platform");
const deletedRuns = database.experiment_runs.deleteMany({}).deletedCount;
const deletedExperiments = database.experiments.deleteMany({}).deletedCount;
print(`Removed ${deletedRuns} runs and ${deletedExperiments} experiments. Re-seeding demonstration data.`);
load("/scripts/seed-demo-data.js");
